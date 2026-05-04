import { Module } from '@nestjs/common';
import { StudentSyncController } from './student-sync.controller';
import { StudentSyncService } from './student-sync.service';

@Module({
  controllers: [StudentSyncController],
  providers: [StudentSyncService],
})
export class StudentSyncModule {}
