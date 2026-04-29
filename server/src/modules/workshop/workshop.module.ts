import { Module } from '@nestjs/common';
import { WorkshopController } from './workshop.controller';

@Module({
  controllers: [WorkshopController],
})
export class WorkshopModule {}

