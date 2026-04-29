import { Module } from '@nestjs/common';
import { AiSummaryController } from './ai-summary.controller';

@Module({
  controllers: [AiSummaryController],
})
export class AiSummaryModule {}

