import { Injectable } from '@nestjs/common';
import {
  RegistrationStatus,
  Role,
  WorkshopStatus,
} from '../../../generated/prisma/enums';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      totalUsers,
      students,
      organizers,
      checkinStaff,
      totalWorkshops,
      draftWorkshops,
      openWorkshops,
      cancelledWorkshops,
      completedWorkshops,
      totalRegistrations,
      pendingRegistrations,
      confirmedRegistrations,
      cancelledRegistrations,
      capacityAggregate,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({ where: { role: Role.ORGANIZER } }),
      this.prisma.user.count({ where: { role: Role.CHECKIN_STAFF } }),
      this.prisma.workshop.count(),
      this.prisma.workshop.count({ where: { status: WorkshopStatus.DRAFT } }),
      this.prisma.workshop.count({ where: { status: WorkshopStatus.OPEN } }),
      this.prisma.workshop.count({ where: { status: WorkshopStatus.CANCELLED } }),
      this.prisma.workshop.count({ where: { status: WorkshopStatus.COMPLETED } }),
      this.prisma.registration.count(),
      this.prisma.registration.count({
        where: { status: RegistrationStatus.PENDING },
      }),
      this.prisma.registration.count({
        where: { status: RegistrationStatus.CONFIRMED },
      }),
      this.prisma.registration.count({
        where: { status: RegistrationStatus.CANCELLED },
      }),
      this.prisma.workshop.aggregate({
        _sum: {
          totalSlots: true,
          slotLeft: true,
        },
      }),
    ]);

    const totalSlots = capacityAggregate._sum.totalSlots ?? 0;
    const remainingSlots = capacityAggregate._sum.slotLeft ?? 0;

    return {
      users: {
        total: totalUsers,
        students,
        organizers,
        checkinStaff,
      },
      workshops: {
        total: totalWorkshops,
        draft: draftWorkshops,
        open: openWorkshops,
        cancelled: cancelledWorkshops,
        completed: completedWorkshops,
      },
      registrations: {
        total: totalRegistrations,
        pending: pendingRegistrations,
        confirmed: confirmedRegistrations,
        cancelled: cancelledRegistrations,
      },
      capacity: {
        totalSlots,
        remainingSlots,
        claimedSlots: Math.max(totalSlots - remainingSlots, 0),
      },
    };
  }
}
