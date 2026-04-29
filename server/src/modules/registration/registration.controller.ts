import { Controller, Post } from '@nestjs/common';

@Controller('registrations')
export class RegistrationController {
  @Post()
  create() {
    return {
      status: 'queued',
      message: 'Registration flow scaffolded.',
    };
  }
}

