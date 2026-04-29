import { Controller, Post } from '@nestjs/common';

@Controller('ai-summary')
export class AiSummaryController {
  @Post()
  create() {
    return { queued: true };
  }
}

