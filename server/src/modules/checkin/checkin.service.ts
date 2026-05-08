import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentStatus,
  RegistrationStatus,
} from '../../../generated/prisma/enums';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SyncCheckinRecordDto, SyncCheckinsDto } from './dto/sync-checkin.dto';
import { ValidateCheckinDto } from './dto/validate-checkin.dto';

type CheckinRegistration = Awaited<
  ReturnType<CheckinService['findRegistrationForCheckin']>
>;
type CheckinRegistrationRecord = NonNullable<CheckinRegistration>;

type SyncRecordResult = {
  qrCode: string | null;
  registrationId: string | null;
  status: 'synced' | 'duplicate' | 'rejected';
  message: string;
};

type SyncCandidate = {
  qrCode: string | null;
  registrationId: string | null;
  checkedInAt: Date | null;
  deviceId?: string;
};

@Injectable()
export class CheckinService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(staffId: string, dto: ValidateCheckinDto) {
    const registration = await this.findRegistrationForCheckin({
      qrCode: dto.qrCode.trim(),
    });

    if (!registration || !this.isCheckinEligible(registration)) {
      throw new NotFoundException('Registration not found or not eligible for check-in');
    }

    return this.recordCheckin({
      registration,
      staffId,
      checkedInAt: new Date(),
      deviceId: dto.deviceId,
    });
  }

  async sync(staffId: string, dto: SyncCheckinsDto) {
    const candidates = dto.records.map((record) => this.toSyncCandidate(record));
    const validCandidates = candidates.filter(
      (candidate) =>
        candidate.checkedInAt &&
        (candidate.qrCode || candidate.registrationId),
    );
    const qrCodes = [
      ...new Set(validCandidates.flatMap((candidate) => candidate.qrCode ?? [])),
    ];
    const registrationIds = [
      ...new Set(
        validCandidates.flatMap((candidate) => candidate.registrationId ?? []),
      ),
    ];

    const registrations = await this.findRegistrationsForSync(
      qrCodes,
      registrationIds,
    );
    const registrationsById = new Map(
      registrations.map((registration) => [registration.id, registration] as const),
    );
    const registrationsByQrCode = new Map(
      registrations.flatMap((registration) =>
        registration.qrCode ? ([[registration.qrCode, registration]] as const) : [],
      ),
    );
    const existingLogs = await this.prisma.checkinLog.findMany({
      where: {
        registrationId: {
          in: registrations.map((registration) => registration.id),
        },
      },
      select: { registrationId: true },
    });
    const alreadyCheckedIn = new Set(
      existingLogs.map((log) => log.registrationId),
    );
    const queuedRegistrationIds = new Set<string>();
    const toCreate: Array<{
      registration: NonNullable<CheckinRegistration>;
      checkedInAt: Date;
      deviceId?: string;
    }> = [];

    const results: SyncRecordResult[] = candidates.map((candidate) => {
      if (!candidate.qrCode && !candidate.registrationId) {
        return {
          qrCode: candidate.qrCode,
          registrationId: candidate.registrationId,
          status: 'rejected',
          message: 'qrCode or registrationId is required',
        };
      }

      if (!candidate.checkedInAt) {
        return {
          qrCode: candidate.qrCode,
          registrationId: candidate.registrationId,
          status: 'rejected',
          message: 'checkedInAt is invalid',
        };
      }

      const registration =
        (candidate.registrationId
          ? registrationsById.get(candidate.registrationId)
          : undefined) ??
        (candidate.qrCode
          ? registrationsByQrCode.get(candidate.qrCode)
          : undefined);

      if (!registration || !this.isCheckinEligible(registration)) {
        return {
          qrCode: candidate.qrCode,
          registrationId: candidate.registrationId,
          status: 'rejected',
          message: 'Registration not found or not eligible',
        };
      }

      if (
        alreadyCheckedIn.has(registration.id) ||
        queuedRegistrationIds.has(registration.id)
      ) {
        return {
          qrCode: registration.qrCode,
          registrationId: registration.id,
          status: 'duplicate',
          message: 'Already checked in',
        };
      }

      queuedRegistrationIds.add(registration.id);
      toCreate.push({
        registration,
        checkedInAt: candidate.checkedInAt,
        deviceId: candidate.deviceId,
      });

      return {
        qrCode: registration.qrCode,
        registrationId: registration.id,
        status: 'synced',
        message: 'Synced',
      };
    });

    if (toCreate.length) {
      const syncedAt = new Date();
      await this.prisma.$transaction(async (tx) => {
        await tx.checkinLog.createMany({
          data: toCreate.map((item) => ({
            registrationId: item.registration.id,
            staffId,
            deviceId: item.deviceId,
            checkedInAt: item.checkedInAt,
            syncedAt,
          })),
          skipDuplicates: true,
        });

        await Promise.all(
          toCreate.map((item) =>
            tx.registration.update({
              where: { id: item.registration.id },
              data: { checkedInAt: item.checkedInAt },
            }),
          ),
        );
      });
    }

    return {
      synced: results.filter((result) => result.status === 'synced').length,
      duplicates: results.filter((result) => result.status === 'duplicate').length,
      rejected: results.filter((result) => result.status === 'rejected').length,
      results,
    };
  }

  private toSyncCandidate(record: SyncCheckinRecordDto): SyncCandidate {
    const qrCode = record.qrCode?.trim() || null;
    const registrationId = record.registrationId?.trim() || null;
    const checkedInAt = new Date(record.checkedInAt);

    return {
      qrCode,
      registrationId,
      checkedInAt: Number.isNaN(checkedInAt.getTime()) ? null : checkedInAt,
      deviceId: record.deviceId,
    };
  }

  private async recordCheckin({
    registration,
    staffId,
    checkedInAt,
    deviceId,
  }: {
    registration: CheckinRegistrationRecord;
    staffId: string;
    checkedInAt: Date;
    deviceId?: string;
  }) {
    const existing = await this.prisma.checkinLog.findUnique({
      where: { registrationId: registration.id },
    });

    if (existing) {
      return this.toResponse(registration, existing.checkedInAt, true);
    }

    const log = await this.prisma.$transaction(async (tx) => {
      const created = await tx.checkinLog.create({
        data: {
          registrationId: registration.id,
          staffId,
          deviceId,
          checkedInAt,
          syncedAt: new Date(),
        },
      });

      await tx.registration.update({
        where: { id: registration.id },
        data: { checkedInAt: created.checkedInAt },
      });

      return created;
    });

    return this.toResponse(registration, log.checkedInAt, false);
  }

  private findRegistrationForCheckin({
    qrCode,
    registrationId,
  }: {
    qrCode?: string;
    registrationId?: string;
  }) {
    if (!qrCode && !registrationId) {
      throw new BadRequestException('qrCode or registrationId is required');
    }

    return this.prisma.registration.findFirst({
      where: {
        OR: [
          ...(qrCode ? [{ qrCode }] : []),
          ...(registrationId ? [{ id: registrationId }] : []),
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
          },
        },
        workshop: {
          select: {
            id: true,
            title: true,
            room: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });
  }

  private findRegistrationsForSync(
    qrCodes: string[],
    registrationIds: string[],
  ): Promise<CheckinRegistrationRecord[]> {
    if (!qrCodes.length && !registrationIds.length) {
      return Promise.resolve([]);
    }

    return this.prisma.registration.findMany({
      where: {
        OR: [
          ...(qrCodes.length ? [{ qrCode: { in: qrCodes } }] : []),
          ...(registrationIds.length ? [{ id: { in: registrationIds } }] : []),
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
          },
        },
        workshop: {
          select: {
            id: true,
            title: true,
            room: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });
  }

  private isCheckinEligible(registration: NonNullable<CheckinRegistration>) {
    return (
      registration.status === RegistrationStatus.CONFIRMED &&
      registration.paymentStatus !== PaymentStatus.FAILED
    );
  }

  private toResponse(
    registration: NonNullable<CheckinRegistration>,
    checkedInAt: Date,
    alreadyCheckedIn: boolean,
  ) {
    return {
      ok: true,
      alreadyCheckedIn,
      registrationId: registration.id,
      qrCode: registration.qrCode,
      checkedInAt,
      student: registration.user,
      workshop: registration.workshop,
    };
  }
}
