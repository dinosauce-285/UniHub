import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import { parse } from 'csv-parse/sync';
import { Role } from '../../../generated/prisma/enums';
import { PrismaService } from '../../core/prisma/prisma.service';
import { hashPassword } from '../auth/password';

type StudentSyncJob = {
  filename?: string;
  requestedBy?: 'cron' | 'manual';
};

type StudentCsvRow = Record<string, string | undefined>;

type RowError = {
  row: number;
  reason: string;
};

const STUDENT_SYNC_QUEUE = 'student-sync';
const STUDENT_SYNC_DLQ = 'student-sync-dlq';
const NIGHTLY_SYNC_JOB = 'nightly-student-sync';
const MANUAL_SYNC_JOB = 'manual-student-sync';
const CRON_PATTERN_2AM = '0 2 * * *';

@Injectable()
export class StudentSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly queue = new Queue<StudentSyncJob>(STUDENT_SYNC_QUEUE, {
    connection: this.createRedisConnection(),
  });
  private readonly deadLetterQueue = new Queue(STUDENT_SYNC_DLQ, {
    connection: this.createRedisConnection(),
  });
  private readonly worker = new Worker<StudentSyncJob>(
    STUDENT_SYNC_QUEUE,
    (job) => this.processSyncJob(job),
    {
      connection: this.createRedisConnection(),
      concurrency: 1,
    },
  );

  constructor(private readonly prisma: PrismaService) {
    this.worker.on('failed', (job, error) => {
      void this.enqueueDeadLetter(job, error);
    });
  }

  async onModuleInit() {
    await this.queue.add(
      NIGHTLY_SYNC_JOB,
      { requestedBy: 'cron' },
      {
        jobId: NIGHTLY_SYNC_JOB,
        repeat: {
          pattern: CRON_PATTERN_2AM,
        },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60_000,
        },
        removeOnComplete: 50,
        removeOnFail: false,
      },
    );
  }

  async onModuleDestroy() {
    await this.worker.close();
    await this.deadLetterQueue.close();
    await this.queue.close();
  }

  async getStatus() {
    const [waiting, active, failed, delayed, dlqWaiting] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
      this.deadLetterQueue.getWaitingCount(),
    ]);

    return {
      status: 'ready',
      queue: {
        name: STUDENT_SYNC_QUEUE,
        waiting,
        active,
        failed,
        delayed,
      },
      deadLetterQueue: {
        name: STUDENT_SYNC_DLQ,
        waiting: dlqWaiting,
      },
      schedule: {
        cron: CRON_PATTERN_2AM,
      },
    };
  }

  async listLogs() {
    return this.prisma.studentSyncLog.findMany({
      orderBy: { runAt: 'desc' },
      take: 20,
    });
  }

  async enqueueManualSync() {
    const job = await this.queue.add(
      MANUAL_SYNC_JOB,
      { requestedBy: 'manual' },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60_000,
        },
        removeOnComplete: 50,
        removeOnFail: false,
      },
    );

    return { queued: true, jobId: job.id };
  }

  private async processSyncJob(job: Job<StudentSyncJob>) {
    const filename = job.data.filename ?? this.resolveDefaultCsvPath();

    try {
      const csv = await readFile(filename, 'utf8');
      const rows = this.parseRows(csv);
      const result = await this.upsertRows(rows);

      await this.prisma.studentSyncLog.create({
        data: {
          filename,
          totalRows: rows.length,
          imported: result.imported,
          errors: result.errors.length,
          errorDetails: result.errors,
        },
      });

      return {
        filename,
        totalRows: rows.length,
        imported: result.imported,
        errors: result.errors.length,
      };
    } catch (error) {
      await this.prisma.studentSyncLog.create({
        data: {
          filename,
          totalRows: 0,
          imported: 0,
          errors: 1,
          errorDetails: [
            {
              row: 0,
              reason: error instanceof Error ? error.message : 'Unknown sync failure',
            },
          ],
        },
      });

      throw error;
    }
  }

  private parseRows(csv: string): StudentCsvRow[] {
    return parse(csv, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as StudentCsvRow[];
  }

  private async upsertRows(rows: StudentCsvRow[]) {
    const errors: RowError[] = [];
    let imported = 0;

    for (const [index, rawRow] of rows.entries()) {
      const rowNumber = index + 2;
      const row = this.normalizeRow(rawRow);
      const studentId = row.studentId?.trim() ?? '';
      const name = row.name?.trim() ?? '';
      const email = row.email?.trim().toLowerCase() ?? '';

      const rowError = this.validateRow(rowNumber, { studentId, name, email });
      if (rowError) {
        errors.push(rowError);
        continue;
      }

      const existingEmailUser = await this.prisma.user.findUnique({
        where: { email },
        select: { studentId: true },
      });

      if (existingEmailUser && existingEmailUser.studentId !== studentId) {
        errors.push({ row: rowNumber, reason: 'email already belongs to another user' });
        continue;
      }

      try {
        await this.prisma.user.upsert({
          where: { studentId },
          update: {
            name,
            email,
            role: Role.STUDENT,
          },
          create: {
            studentId,
            name,
            email,
            role: Role.STUDENT,
            passwordHash: await hashPassword(
              process.env.STUDENT_IMPORT_TEMP_PASSWORD ?? 'UniHub@2026',
            ),
          },
        });
      } catch (error) {
        errors.push({
          row: rowNumber,
          reason: error instanceof Error ? error.message : 'database upsert failed',
        });
        continue;
      }

      imported += 1;
    }

    return { imported, errors };
  }

  private validateRow(
    row: number,
    input: { studentId: string; name: string; email: string },
  ): RowError | null {
    if (!input.studentId) {
      return { row, reason: 'missing student ID' };
    }

    if (!input.name) {
      return { row, reason: 'missing name' };
    }

    if (!input.email) {
      return { row, reason: 'missing email' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      return { row, reason: 'invalid email' };
    }

    return null;
  }

  private normalizeRow(row: StudentCsvRow) {
    const normalized: Record<string, string | undefined> = {};

    for (const [key, value] of Object.entries(row)) {
      normalized[this.normalizeHeader(key)] = value;
    }

    return normalized;
  }

  private normalizeHeader(header: string) {
    const compact = header.trim().toLowerCase().replace(/[\s_-]+/g, '');

    if (compact === 'studentid') {
      return 'studentId';
    }

    return compact;
  }

  private resolveDefaultCsvPath() {
    if (process.env.STUDENT_SYNC_CSV_PATH) {
      return process.env.STUDENT_SYNC_CSV_PATH;
    }

    const cwdDataPath = join(process.cwd(), 'data', 'sample-students.csv');
    if (existsSync(cwdDataPath)) {
      return cwdDataPath;
    }

    return join(process.cwd(), '..', 'data', 'sample-students.csv');
  }

  private createRedisConnection() {
    return {
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      maxRetriesPerRequest: null,
    };
  }

  private async enqueueDeadLetter(job: Job<StudentSyncJob> | undefined, error: Error) {
    await this.deadLetterQueue.add(
      'failed-student-sync',
      {
        failedJobId: job?.id,
        failedJobName: job?.name,
        data: job?.data,
        reason: error.message,
        failedAt: new Date().toISOString(),
      },
      {
        removeOnComplete: false,
        removeOnFail: false,
      },
    );
  }
}
