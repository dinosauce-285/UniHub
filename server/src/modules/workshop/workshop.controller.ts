import { Controller, Get } from '@nestjs/common';
import { WorkshopService } from './workshop.service';

@Controller('workshops')
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Get()
  list() {
    return this.workshopService.list();
  }
}
