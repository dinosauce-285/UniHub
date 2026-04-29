import { Controller, Get } from '@nestjs/common';

@Controller('workshops')
export class WorkshopController {
  @Get()
  list() {
    return [
      {
        id: 'demo-workshop',
        title: 'Building Scalable Workshop Platforms',
        speaker: 'UniHub Team',
        totalSlots: 120,
      },
    ];
  }
}

