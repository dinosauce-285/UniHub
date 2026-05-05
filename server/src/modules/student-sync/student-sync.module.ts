import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { StudentSyncController } from './student-sync.controller';
import { STUDENT_SYNC_QUEUE, StudentSyncService } from './student-sync.service';
import { StudentSyncWorker } from './student-sync.worker';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
        maxRetriesPerRequest: null,
      },
    }),
    BullModule.registerQueue({
      name: STUDENT_SYNC_QUEUE,
    }),
  ],
  controllers: [StudentSyncController],
  providers: [StudentSyncService, StudentSyncWorker],
})
export class StudentSyncModule {}
