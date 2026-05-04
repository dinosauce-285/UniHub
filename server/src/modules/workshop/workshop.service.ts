import { Injectable } from '@nestjs/common';
import { WorkshopStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';

@Injectable()
export class WorkshopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async list() {
    const workshops = await this.prisma.workshop.findMany({
      where: {
        status: WorkshopStatus.OPEN,
      },
      orderBy: {
        startTime: 'asc',
      },
      select: {
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
      },
    });

    return Promise.all(
      workshops.map(async (workshop) => {
        const key = this.slotKey(workshop.id);
        await this.redisService
          .getClient()
          .set(key, String(Math.max(workshop.slotLeft, 0)), 'NX');

        const redisSlotLeft = await this.redisService.getClient().get(key);

        return {
          ...workshop,
          slotLeft: redisSlotLeft ? Number(redisSlotLeft) : workshop.slotLeft,
        };
      }),
    );
  }

  private slotKey(workshopId: string) {
    return `workshop:${workshopId}:slots`;
  }
}
