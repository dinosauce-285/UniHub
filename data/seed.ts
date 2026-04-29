import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: 'Student One', email: 'student1@unihub.local', role: Role.STUDENT, studentId: 'SV001' },
    { name: 'Student Two', email: 'student2@unihub.local', role: Role.STUDENT, studentId: 'SV002' },
    { name: 'Organizer One', email: 'organizer1@unihub.local', role: Role.ORGANIZER, studentId: null },
    { name: 'Organizer Two', email: 'organizer2@unihub.local', role: Role.ORGANIZER, studentId: null },
    { name: 'Checkin One', email: 'checkin1@unihub.local', role: Role.CHECKIN_STAFF, studentId: null },
    { name: 'Checkin Two', email: 'checkin2@unihub.local', role: Role.CHECKIN_STAFF, studentId: null },
  ];

  for (const user of roles) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });
  }

  const workshops = [
    {
      title: 'Building Resilient Campus Platforms',
      description: 'Architecture, queues, and graceful degradation.',
      speaker: 'UniHub Team',
      room: 'A101',
      totalSlots: 150,
      startTime: new Date('2026-05-10T08:00:00.000Z'),
      endTime: new Date('2026-05-10T10:00:00.000Z'),
    },
    {
      title: 'Offline-first Check-in Design',
      description: 'IndexedDB and sync strategies for event operations.',
      speaker: 'Platform Ops',
      room: 'B204',
      totalSlots: 80,
      startTime: new Date('2026-05-11T01:00:00.000Z'),
      endTime: new Date('2026-05-11T03:00:00.000Z'),
    },
  ];

  for (const workshop of workshops) {
    await prisma.workshop.upsert({
      where: { id: workshop.title.toLowerCase().replaceAll(/\s+/g, '-') },
      update: workshop,
      create: {
        id: workshop.title.toLowerCase().replaceAll(/\s+/g, '-'),
        ...workshop,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
