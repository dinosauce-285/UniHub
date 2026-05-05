import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { PrismaService } from '../../core/prisma/prisma.service';

export type StudentSyncJob = {
  filename?: string;
  requestedBy?: 'cron' | 'manual';
};

export const STUDENT_SYNC_QUEUE = 'student-sync';
const NIGHTLY_SYNC_JOB = 'nightly-student-sync';
const MANUAL_SYNC_JOB = 'manual-student-sync';
const CRON_PATTERN_2AM = '0 2 * * *';

@Injectable()
export class StudentSyncService {
  constructor(
    @InjectQueue(STUDENT_SYNC_QUEUE)
    private readonly queue: Queue<StudentSyncJob>,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CRON_PATTERN_2AM)
  async enqueueNightlySync() {
    const job = await this.queue.add(
      NIGHTLY_SYNC_JOB,
      { requestedBy: 'cron' },
      this.defaultJobOptions(),
    );

    return { queued: true, jobId: job.id };
  }

  async enqueueManualSync() {
    const job = await this.queue.add(
      MANUAL_SYNC_JOB,
      { requestedBy: 'manual' },
      this.defaultJobOptions(),
    );

    return { queued: true, jobId: job.id };
  }

  async listLogs(input: { page?: number; pageSize?: number; sort?: 'asc' | 'desc' }) {
    const page = Math.max(input.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100);
    const sort = input.sort ?? 'desc';

    const [items, total] = await Promise.all([
      this.prisma.studentSyncLog.findMany({
        orderBy: { runAt: sort },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.studentSyncLog.count(),
    ]);

    return { items, page, pageSize, total };
  }

  private defaultJobOptions() {
    return {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60_000,
      },
      removeOnComplete: 50,
      removeOnFail: false,
    } as const;
  }
}
