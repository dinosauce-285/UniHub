import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  RegistrationStatus,
  WorkshopStatus,
} from '../../../generated/prisma/enums';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';

const workshopSelect = {
  id: true,
  title: true,
  description: true,
  speaker: true,
  room: true,
  roomMapUrl: true,
  startTime: true,
  endTime: true,
  totalSlots: true,
  slotLeft: true,
  status: true,
  isPaid: true,
  price: true,
  aiSummary: true,
  createdAt: true,
} as const;

const MAX_ROOM_MAP_SIZE_BYTES = 5 * 1024 * 1024;

type WorkshopRecord = {
  id: string;
  slotLeft: number;
};

@Injectable()
export class WorkshopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async list() {
    const workshops = await this.prisma.workshop.findMany({
      where: {
        status: WorkshopStatus.OPEN,
      },
      orderBy: {
        startTime: 'asc',
      },
      select: workshopSelect,
    });

    return Promise.all(
      workshops.map((workshop) => this.hydrateSlotCount(workshop, true)),
    );
  }

  async findPublic(id: string) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { id },
      select: workshopSelect,
    });

    if (!workshop || workshop.status === WorkshopStatus.DRAFT) {
      throw new NotFoundException('Workshop not found');
    }

    return this.hydrateSlotCount(workshop, true);
  }

  async listForOrganizer() {
    const workshops = await this.prisma.workshop.findMany({
      orderBy: {
        startTime: 'asc',
      },
      select: workshopSelect,
    });

    return Promise.all(
      workshops.map((workshop) => this.hydrateSlotCount(workshop, false)),
    );
  }

  async create(dto: CreateWorkshopDto) {
    const schedule = this.parseSchedule(dto.startTime, dto.endTime);
    const isPaid = dto.isPaid ?? false;
    const price = this.normalizePrice(isPaid, dto.price ?? 0);
    const roomMapUrl = this.normalizeRoomMapUrl(dto.roomMapUrl);
    const slotLeft = dto.totalSlots;

    const workshop = await this.prisma.workshop.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        speaker: dto.speaker.trim(),
        room: dto.room.trim(),
        roomMapUrl,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        totalSlots: dto.totalSlots,
        slotLeft,
        status: dto.status ?? WorkshopStatus.DRAFT,
        isPaid,
        price,
      },
      select: workshopSelect,
    });

    await this.replaceSlotCounter(workshop.id, workshop.slotLeft);
    return this.hydrateSlotCount(workshop, false);
  }

  async update(id: string, dto: UpdateWorkshopDto) {
    const existing = await this.findForMutation(id);
    const startTime = dto.startTime
      ? new Date(dto.startTime)
      : existing.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : existing.endTime;
    this.assertValidSchedule(startTime, endTime);

    const isPaid = dto.isPaid ?? existing.isPaid;
    const price = this.normalizePrice(isPaid, dto.price ?? existing.price);
    const roomMapUrl =
      dto.roomMapUrl === undefined
        ? existing.roomMapUrl
        : this.normalizeRoomMapUrl(dto.roomMapUrl);

    let slotLeft = existing.slotLeft;
    if (dto.totalSlots !== undefined) {
      const activeRegistrations = await this.countActiveRegistrations(id);
      if (dto.totalSlots < activeRegistrations) {
        throw new BadRequestException(
          'Total slots cannot be lower than active registrations',
        );
      }
      slotLeft = dto.totalSlots - activeRegistrations;
    }

    const workshop = await this.prisma.workshop.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        speaker: dto.speaker?.trim(),
        room: dto.room?.trim(),
        roomMapUrl,
        startTime,
        endTime,
        totalSlots: dto.totalSlots,
        slotLeft,
        isPaid,
        price,
      },
      select: workshopSelect,
    });

    if (dto.totalSlots !== undefined) {
      await this.replaceSlotCounter(id, slotLeft);
    }

    return this.hydrateSlotCount(workshop, false);
  }

  async updateStatus(id: string, status: WorkshopStatus) {
    const existing = await this.findForMutation(id);

    if (
      existing.status === WorkshopStatus.CANCELLED &&
      status !== WorkshopStatus.CANCELLED
    ) {
      throw new BadRequestException('Cancelled workshops cannot be reopened');
    }

    const workshop = await this.prisma.workshop.update({
      where: { id },
      data: { status },
      select: workshopSelect,
    });

    return this.hydrateSlotCount(workshop, false);
  }

  async uploadRoomMap(
    id: string,
    file: Express.Multer.File | undefined,
  ) {
    await this.findForMutation(id);
    const fileInfo = this.validateRoomMapFile(file);

    const filename = `room-maps/${id}-${randomUUID()}${fileInfo.extension}`;
    const { data: uploadData, error } = await this.supabaseService
      .getClient()
      .storage.from('unihub-uploads')
      .upload(filename, fileInfo.buffer, {
        contentType: fileInfo.mimetype,
        upsert: true,
      });

    if (error) {
      throw new BadRequestException(`Failed to upload to Supabase: ${error.message}`);
    }

    const { data: publicUrlData } = this.supabaseService
      .getClient()
      .storage.from('unihub-uploads')
      .getPublicUrl(filename);

    const roomMapUrl = publicUrlData.publicUrl;
    const workshop = await this.prisma.workshop.update({
      where: { id },
      data: { roomMapUrl },
      select: workshopSelect,
    });

    return {
      workshopId: id,
      roomMapUrl,
      workshop: await this.hydrateSlotCount(workshop, false),
    };
  }

  private async findForMutation(id: string) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { id },
    });

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    return workshop;
  }

  private async hydrateSlotCount<T extends WorkshopRecord>(
    workshop: T,
    initializeMissing: boolean,
  ) {
    const key = this.slotKey(workshop.id);
    if (initializeMissing) {
      await this.redisService
        .getClient()
        .set(key, String(Math.max(workshop.slotLeft, 0)), 'NX');
    }

    const redisSlotLeft = await this.redisService.getClient().get(key);

    return {
      ...workshop,
      slotLeft: redisSlotLeft ? Number(redisSlotLeft) : workshop.slotLeft,
    };
  }

  private async replaceSlotCounter(workshopId: string, slotLeft: number) {
    await this.redisService
      .getClient()
      .set(this.slotKey(workshopId), String(Math.max(slotLeft, 0)));
  }

  private async countActiveRegistrations(workshopId: string) {
    return this.prisma.registration.count({
      where: {
        workshopId,
        status: {
          not: RegistrationStatus.CANCELLED,
        },
      },
    });
  }

  private parseSchedule(startValue: string, endValue: string) {
    const startTime = new Date(startValue);
    const endTime = new Date(endValue);
    this.assertValidSchedule(startTime, endTime);
    return { startTime, endTime };
  }

  private assertValidSchedule(startTime: Date, endTime: Date) {
    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      endTime <= startTime
    ) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  private normalizePrice(isPaid: boolean, price: number) {
    if (!isPaid) {
      return 0;
    }

    if (price <= 0) {
      throw new BadRequestException('Paid workshops require a positive price');
    }

    return price;
  }

  private normalizeRoomMapUrl(value: string | null | undefined) {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }

    if (/^https?:\/\/\S+$/i.test(trimmed)) {
      return trimmed;
    }

    throw new BadRequestException('Room map URL must be a valid URL');
  }

  private validateRoomMapFile(file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Room map file is required');
    }

    if (file.size > MAX_ROOM_MAP_SIZE_BYTES) {
      throw new BadRequestException('Room map file must be 5 MB or smaller');
    }

    const extension = extname(file.originalname).toLowerCase();
    const allowed = new Map([
      ['.png', 'image/png'],
      ['.jpg', 'image/jpeg'],
      ['.jpeg', 'image/jpeg'],
      ['.webp', 'image/webp'],
      ['.svg', 'image/svg+xml'],
      ['.pdf', 'application/pdf'],
    ]);

    const expectedMime = allowed.get(extension);
    if (!expectedMime || file.mimetype !== expectedMime) {
      throw new BadRequestException(
        'Room map must be a PNG, JPEG, WebP, SVG, or PDF file',
      );
    }

    if (!this.hasExpectedSignature(file.buffer, extension)) {
      throw new BadRequestException('Room map file content is invalid');
    }

    return { buffer: file.buffer, extension, mimetype: file.mimetype };
  }

  private hasExpectedSignature(buffer: Buffer, extension: string) {
    if (extension === '.png') {
      return buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    }

    if (extension === '.jpg' || extension === '.jpeg') {
      return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    }

    if (extension === '.webp') {
      return (
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    }

    if (extension === '.pdf') {
      return buffer.subarray(0, 4).toString('ascii') === '%PDF';
    }

    if (extension === '.svg') {
      const preview = buffer.subarray(0, 512).toString('utf8').trimStart();
      return preview.startsWith('<svg') || preview.includes('<svg');
    }

    return false;
  }

  private slotKey(workshopId: string) {
    return `workshop:${workshopId}:slots`;
  }
}
