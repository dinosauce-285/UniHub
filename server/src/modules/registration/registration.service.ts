import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import {
  PaymentStatus,
  RegistrationStatus,
  WorkshopStatus,
} from '../../../generated/prisma/enums';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

type WorkshopSummary = {
  id: string;
  title: string;
  speaker: string;
  room: string;
  startTime: Date;
  endTime: Date;
  isPaid: boolean;
  price: number;
};

type RegistrationRecord = {
  id: string;
  userId: string;
  workshopId: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  qrCode: string | null;
  createdAt: Date;
  workshop: WorkshopSummary;
};

const workshopSummarySelect = {
  id: true,
  title: true,
  speaker: true,
  room: true,
  startTime: true,
  endTime: true,
  isPaid: true,
  price: true,
} as const;

@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(
    userId: string,
    dto: CreateRegistrationDto,
    idempotencyHeader: string | string[] | undefined,
  ) {
    const idempotencyKey = this.normalizeIdempotencyKey(idempotencyHeader);
    const cached = await this.getCachedResponse(idempotencyKey);
    if (cached) {
      return cached;
    }

    const persisted = await this.findRegistrationByIdempotencyKey(idempotencyKey);
    if (persisted) {
      const response = await this.toResponse(persisted);
      await this.cacheResponse(idempotencyKey, response);
      return response;
    }

    const workshop = await this.prisma.workshop.findUnique({
      where: { id: dto.workshopId },
    });

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    if (workshop.status !== WorkshopStatus.OPEN) {
      throw new ConflictException('Workshop is not open for registration');
    }

    await this.ensureSlotCounter(workshop.id, workshop.slotLeft);
    const remaining = await this.redisService
      .getClient()
      .decr(this.slotKey(workshop.id));

    if (remaining < 0) {
      await this.returnSlot(workshop.id);
      throw new ConflictException('Workshop is full');
    }

    let registration: RegistrationRecord;

    try {
      registration = await this.prisma.$transaction(async (tx) => {
        const created = await tx.registration.create({
          data: {
            userId,
            workshopId: workshop.id,
            status: RegistrationStatus.CONFIRMED,
            paymentStatus: workshop.isPaid
              ? PaymentStatus.PENDING
              : PaymentStatus.FREE,
            qrCode: this.createQrPayload(),
            idempotencyKey,
          },
          include: {
            workshop: {
              select: workshopSummarySelect,
            },
          },
        });

        await tx.workshop.update({
          where: { id: workshop.id },
          data: {
            slotLeft: {
              decrement: 1,
            },
          },
        });

        return created;
      });
    } catch (error) {
      await this.returnSlot(workshop.id);

      if (this.isUniqueConstraintError(error)) {
        const sameIdempotencyRequest =
          await this.findRegistrationByIdempotencyKey(idempotencyKey);

        if (sameIdempotencyRequest) {
          const response = await this.toResponse(sameIdempotencyRequest);
          await this.cacheResponse(idempotencyKey, response);
          return response;
        }

        throw new ConflictException(
          'You are already registered for this workshop',
        );
      }

      throw error;
    }

    const response = await this.toResponse(registration);
    await this.cacheResponse(idempotencyKey, response);
    return response;
  }

  async listForUser(userId: string) {
    const registrations = await this.prisma.registration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        workshop: {
          select: workshopSummarySelect,
        },
      },
    });

    return Promise.all(
      registrations.map((registration) => this.toResponse(registration)),
    );
  }

  private normalizeIdempotencyKey(header: string | string[] | undefined) {
    const rawValue = Array.isArray(header) ? header[0] : header;
    const value = rawValue?.trim();

    if (!value) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    if (value.length > 128) {
      throw new BadRequestException('Idempotency-Key header is too long');
    }

    return value;
  }

  private async findRegistrationByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.registration.findUnique({
      where: { idempotencyKey },
      include: {
        workshop: {
          select: workshopSummarySelect,
        },
      },
    });
  }

  private async ensureSlotCounter(workshopId: string, slotLeft: number) {
    await this.redisService
      .getClient()
      .set(this.slotKey(workshopId), String(Math.max(slotLeft, 0)), 'NX');
  }

  private async returnSlot(workshopId: string) {
    await this.redisService.getClient().incr(this.slotKey(workshopId));
  }

  private slotKey(workshopId: string) {
    return `workshop:${workshopId}:slots`;
  }

  private idempotencyKey(key: string) {
    return `idempotency:${key}`;
  }

  private async getCachedResponse(key: string) {
    const cached = await this.redisService.getClient().get(this.idempotencyKey(key));
    return cached ? JSON.parse(cached) : null;
  }

  private async cacheResponse(key: string, response: unknown) {
    await this.redisService
      .getClient()
      .set(
        this.idempotencyKey(key),
        JSON.stringify(response),
        'EX',
        IDEMPOTENCY_TTL_SECONDS,
      );
  }

  private createQrPayload() {
    return `UNIHUB-${randomUUID()}`;
  }

  private async toResponse(registration: RegistrationRecord) {
    return {
      id: registration.id,
      userId: registration.userId,
      workshopId: registration.workshopId,
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      qrCode: registration.qrCode,
      qrCodeImage: registration.qrCode
        ? await QRCode.toDataURL(registration.qrCode, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 240,
          })
        : null,
      createdAt: registration.createdAt,
      workshop: registration.workshop,
    };
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
  }
}
