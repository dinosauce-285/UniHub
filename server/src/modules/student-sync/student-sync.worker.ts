import { createReadStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { parse } from 'csv-parse';
import { Role } from '../../../generated/prisma/enums';
import { PrismaService } from '../../core/prisma/prisma.service';
import { hashPassword } from '../auth/password';
import { STUDENT_SYNC_QUEUE, StudentSyncJob } from './student-sync.service';

type StudentCsvRow = Record<string, string | undefined>;

type RowError = {
  row: number;
  reason: string;
};

@Injectable()
@Processor(STUDENT_SYNC_QUEUE, { concurrency: 1 })
export class StudentSyncWorker extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<StudentSyncJob>) {
    const filename = job.data.filename ?? this.resolveDefaultCsvPath();
    const result = {
      filename,
      totalRows: 0,
      imported: 0,
      errors: [] as RowError[],
    };

    try {
      const parser = createReadStream(filename).pipe(
        parse({
          bom: true,
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }),
      );

      for await (const rawRow of parser as AsyncIterable<StudentCsvRow>) {
        result.totalRows += 1;
        const rowNumber = result.totalRows + 1;
        const row = this.normalizeRow(rawRow);
        const studentId = row.studentId?.trim() ?? '';
        const name = row.name?.trim() ?? '';
        const email = row.email?.trim().toLowerCase() ?? '';

        const rowError = this.validateRow(rowNumber, { studentId, name, email });
        if (rowError) {
          result.errors.push(rowError);
          continue;
        }

        const imported = await this.upsertStudent(rowNumber, {
          studentId,
          name,
          email,
        });

        if (imported === true) {
          result.imported += 1;
        } else {
          result.errors.push(imported);
        }
      }
    } catch (error) {
      result.errors.push({
        row: 0,
        reason: error instanceof Error ? error.message : 'CSV file could not be read',
      });
    }

    await this.prisma.studentSyncLog.create({
      data: {
        filename,
        totalRows: result.totalRows,
        imported: result.imported,
        errors: result.errors.length,
        errorDetails: result.errors,
      },
    });

    return {
      filename,
      totalRows: result.totalRows,
      imported: result.imported,
      errors: result.errors.length,
    };
  }

  private async upsertStudent(
    row: number,
    input: { studentId: string; name: string; email: string },
  ): Promise<true | RowError> {
    const existingEmailUser = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { studentId: true },
    });

    if (existingEmailUser && existingEmailUser.studentId !== input.studentId) {
      return { row, reason: 'email already belongs to another user' };
    }

    try {
      await this.prisma.user.upsert({
        where: { studentId: input.studentId },
        update: {
          name: input.name,
          email: input.email,
          role: Role.STUDENT,
        },
        create: {
          studentId: input.studentId,
          name: input.name,
          email: input.email,
          role: Role.STUDENT,
          passwordHash: await hashPassword(
            process.env.STUDENT_IMPORT_TEMP_PASSWORD ?? 'UniHub@2026',
          ),
        },
      });
    } catch (error) {
      return {
        row,
        reason: error instanceof Error ? error.message : 'database upsert failed',
      };
    }

    return true;
  }

  private validateRow(
    row: number,
    input: { studentId: string; name: string; email: string },
  ): RowError | null {
    if (!input.studentId) {
      return { row, reason: 'missing student ID' };
    }

    if (!input.email) {
      return { row, reason: 'missing email' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      return { row, reason: 'invalid email' };
    }

    if (!input.name) {
      return { row, reason: 'missing name' };
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
    if (process.env.LEGACY_CSV_PATH) {
      return process.env.LEGACY_CSV_PATH;
    }

    const candidatePaths = [
      join(process.cwd(), 'data', 'legacy-students.csv'),
      join(process.cwd(), '..', 'data', 'legacy-students.csv'),
      join(process.cwd(), 'data', 'sample-students.csv'),
      join(process.cwd(), '..', 'data', 'sample-students.csv'),
    ];

    for (const candidatePath of candidatePaths) {
      if (existsSync(candidatePath)) {
        return candidatePath;
      }
    }

    return join(process.cwd(), '..', 'data', 'sample-students.csv');
  }
}
