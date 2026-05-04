import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { parse } from 'csv-parse/sync';
import { Role } from '../../../generated/prisma/enums';
import { PrismaService } from '../../core/prisma/prisma.service';

type StudentCsvRow = Record<string, string | undefined>;

export type StudentImportResult = {
  created: number;
  skipped: number;
  errors: string[];
};

const MAX_ROWS = 1000;
const BCRYPT_COST = 10;

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async importCsv(buffer: Buffer): Promise<StudentImportResult> {
    const rows = this.parseRows(buffer);

    if (rows.length > MAX_ROWS) {
      throw new BadRequestException('CSV files can include at most 1000 rows');
    }

    const result: StudentImportResult = {
      created: 0,
      skipped: 0,
      errors: [],
    };
    const seenEmails = new Set<string>();
    const seenStudentIds = new Set<string>();
    const temporaryPassword = process.env.STUDENT_IMPORT_TEMP_PASSWORD ?? 'UniHub@2026';

    for (const [index, rawRow] of rows.entries()) {
      const rowNumber = index + 2;
      const row = this.normalizeRow(rawRow);
      const email = row.email?.trim().toLowerCase() ?? '';
      const name = row.name?.trim() ?? '';
      const studentId = row.studentId?.trim() || null;

      const rowError = await this.validateRow(rowNumber, {
        email,
        name,
        studentId,
        seenEmails,
        seenStudentIds,
      });

      if (rowError) {
        result.skipped += 1;
        result.errors.push(rowError);
        continue;
      }

      seenEmails.add(email);
      if (studentId) {
        seenStudentIds.add(studentId);
      }

      await this.prisma.user.create({
        data: {
          email,
          name,
          studentId,
          role: Role.STUDENT,
          passwordHash: await bcrypt.hash(temporaryPassword, BCRYPT_COST),
        },
      });

      result.created += 1;
    }

    return result;
  }

  private parseRows(buffer: Buffer): StudentCsvRow[] {
    try {
      return parse(buffer, {
        bom: true,
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as StudentCsvRow[];
    } catch {
      throw new BadRequestException('CSV file could not be parsed');
    }
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

  private async validateRow(
    rowNumber: number,
    input: {
      email: string;
      name: string;
      studentId: string | null;
      seenEmails: Set<string>;
      seenStudentIds: Set<string>;
    },
  ) {
    if (!input.email) {
      return `Row ${rowNumber}: missing email`;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      return `Row ${rowNumber}: invalid email`;
    }

    if (!input.name) {
      return `Row ${rowNumber}: missing name`;
    }

    if (input.seenEmails.has(input.email)) {
      return `Row ${rowNumber}: duplicate email in CSV`;
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingEmail) {
      return `Row ${rowNumber}: email already exists`;
    }

    if (!input.studentId) {
      return null;
    }

    if (input.seenStudentIds.has(input.studentId)) {
      return `Row ${rowNumber}: duplicate student ID in CSV`;
    }

    const existingStudentId = await this.prisma.user.findUnique({
      where: { studentId: input.studentId },
      select: { id: true },
    });

    if (existingStudentId) {
      return `Row ${rowNumber}: student ID already exists`;
    }

    return null;
  }
}
