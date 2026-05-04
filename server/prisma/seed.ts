import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PaymentStatus,
  PrismaClient,
  RegistrationStatus,
  Role,
  WorkshopStatus,
} from '../generated/prisma/client';
import { hashPassword } from '../src/modules/auth/password';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(
  pool as unknown as ConstructorParameters<typeof PrismaPg>[0],
);
const prisma = new PrismaClient({ adapter });

const dataDir = existsSync(join(process.cwd(), 'data'))
  ? join(process.cwd(), 'data')
  : join(process.cwd(), '..', 'data');

type StudentRow = {
  studentId: string;
  name: string;
  email: string;
};

function readStudents(): StudentRow[] {
  const csv = readFileSync(join(dataDir, 'sample-students.csv'), 'utf8').trim();
  const [, ...rows] = csv.split(/\r?\n/);

  return rows.map((row) => {
    const [studentId, name, email] = row.split(',').map((value) => value.trim());
    return { studentId, name, email };
  });
}

async function seedUsers() {
  const students = readStudents();
  const demoPasswordHash = await hashPassword('Password123!');
  const staff = [
    {
      name: 'Organizer One',
      email: 'organizer1@unihub.local',
      role: Role.ORGANIZER,
      studentId: null,
    },
    {
      name: 'Organizer Two',
      email: 'organizer2@unihub.local',
      role: Role.ORGANIZER,
      studentId: null,
    },
    {
      name: 'Checkin One',
      email: 'checkin1@unihub.local',
      role: Role.CHECKIN_STAFF,
      studentId: null,
    },
    {
      name: 'Checkin Two',
      email: 'checkin2@unihub.local',
      role: Role.CHECKIN_STAFF,
      studentId: null,
    },
  ];

  for (const student of students) {
    await prisma.user.upsert({
      where: { email: student.email },
      update: {
        name: student.name,
        studentId: student.studentId,
        passwordHash: demoPasswordHash,
        role: Role.STUDENT,
      },
      create: {
        ...student,
        passwordHash: demoPasswordHash,
        role: Role.STUDENT,
      },
    });
  }

  for (const user of staff) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        ...user,
        passwordHash: demoPasswordHash,
      },
      create: {
        ...user,
        passwordHash: demoPasswordHash,
      },
    });
  }

  await prisma.studentSyncLog.create({
    data: {
      filename: 'sample-students.csv',
      totalRows: students.length,
      imported: students.length,
      errors: 0,
      errorDetails: [],
    },
  });
}

async function resetDatabase() {
  await prisma.checkinLog.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.studentSyncLog.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();
}

async function seedWorkshops() {
  const workshops = [
    {
      id: 'building-resilient-campus-platforms',
      title: 'Building Resilient Campus Platforms',
      description: 'Architecture, queues, and graceful degradation.',
      speaker: 'UniHub Team',
      room: 'A101',
      roomMapUrl: 'https://maps.unihub.local/a101',
      totalSlots: 150,
      slotLeft: 147,
      status: WorkshopStatus.OPEN,
      isPaid: false,
      price: 0,
      aiSummary:
        'A practical workshop on backend architecture for reliable campus event systems.',
      startTime: new Date('2026-05-10T08:00:00.000Z'),
      endTime: new Date('2026-05-10T10:00:00.000Z'),
    },
    {
      id: 'offline-first-check-in-design',
      title: 'Offline-first Check-in Design',
      description: 'IndexedDB and sync strategies for event operations.',
      speaker: 'Platform Ops',
      room: 'B204',
      roomMapUrl: 'https://maps.unihub.local/b204',
      totalSlots: 80,
      slotLeft: 78,
      status: WorkshopStatus.OPEN,
      isPaid: false,
      price: 0,
      aiSummary:
        'Hands-on patterns for resilient event check-in when network access is unreliable.',
      startTime: new Date('2026-05-11T01:00:00.000Z'),
      endTime: new Date('2026-05-11T03:00:00.000Z'),
    },
    {
      id: 'ai-assisted-student-services',
      title: 'AI-assisted Student Services',
      description: 'Using AI to summarize, route, and support student requests.',
      speaker: 'Student Success Lab',
      room: 'C302',
      roomMapUrl: 'https://maps.unihub.local/c302',
      totalSlots: 60,
      slotLeft: 59,
      status: WorkshopStatus.DRAFT,
      isPaid: true,
      price: 50000,
      aiSummary:
        'A draft paid workshop for testing payment and publishing workflows.',
      startTime: new Date('2026-05-12T02:00:00.000Z'),
      endTime: new Date('2026-05-12T04:00:00.000Z'),
    },
  ];

  for (const workshop of workshops) {
    await prisma.workshop.upsert({
      where: { id: workshop.id },
      update: workshop,
      create: workshop,
    });
  }
}

async function seedRegistrations() {
  const [studentOne, studentTwo, studentThree, checkinStaff] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { email: 'student1@unihub.local' } }),
      prisma.user.findUniqueOrThrow({ where: { email: 'student2@unihub.local' } }),
      prisma.user.findUniqueOrThrow({ where: { email: 'student3@unihub.local' } }),
      prisma.user.findUniqueOrThrow({ where: { email: 'checkin1@unihub.local' } }),
    ]);

  const registrations = [
    {
      userId: studentOne.id,
      workshopId: 'building-resilient-campus-platforms',
      status: RegistrationStatus.CONFIRMED,
      paymentStatus: PaymentStatus.FREE,
      qrCode: 'UNIHUB-SV001-RESILIENT',
      idempotencyKey: 'seed-sv001-resilient',
    },
    {
      userId: studentTwo.id,
      workshopId: 'building-resilient-campus-platforms',
      status: RegistrationStatus.CONFIRMED,
      paymentStatus: PaymentStatus.FREE,
      qrCode: 'UNIHUB-SV002-RESILIENT',
      idempotencyKey: 'seed-sv002-resilient',
    },
    {
      userId: studentThree.id,
      workshopId: 'offline-first-check-in-design',
      status: RegistrationStatus.PENDING,
      paymentStatus: PaymentStatus.FREE,
      qrCode: 'UNIHUB-SV003-OFFLINE',
      idempotencyKey: 'seed-sv003-offline',
    },
  ];

  for (const registration of registrations) {
    await prisma.registration.upsert({
      where: {
        userId_workshopId: {
          userId: registration.userId,
          workshopId: registration.workshopId,
        },
      },
      update: registration,
      create: registration,
    });
  }

  const checkedInRegistration = await prisma.registration.findUniqueOrThrow({
    where: {
      userId_workshopId: {
        userId: studentOne.id,
        workshopId: 'building-resilient-campus-platforms',
      },
    },
  });
  const checkedInAt = new Date('2026-05-10T08:05:00.000Z');

  await prisma.registration.update({
    where: { id: checkedInRegistration.id },
    data: { checkedInAt },
  });

  await prisma.checkinLog.upsert({
    where: { registrationId: checkedInRegistration.id },
    update: {
      staffId: checkinStaff.id,
      deviceId: 'seed-kiosk-01',
      checkedInAt,
      syncedAt: new Date('2026-05-10T08:06:00.000Z'),
    },
    create: {
      registrationId: checkedInRegistration.id,
      staffId: checkinStaff.id,
      deviceId: 'seed-kiosk-01',
      checkedInAt,
      syncedAt: new Date('2026-05-10T08:06:00.000Z'),
    },
  });
}

async function main() {
  await resetDatabase();
  await seedUsers();
  await seedWorkshops();
  await seedRegistrations();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
