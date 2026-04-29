import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: 'UniHub API',
      status: 'ok',
      docs: 'See README.md for local setup.',
    };
  }
}

