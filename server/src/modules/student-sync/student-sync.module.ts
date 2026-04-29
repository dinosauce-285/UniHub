import { Module } from '@nestjs/common';
import { StudentSyncController } from './student-sync.controller';

@Module({
  controllers: [StudentSyncController],
})
export class StudentSyncModule {}

