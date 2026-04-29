import { Body, Controller, Post } from '@nestjs/common';

class LoginDto {
  email!: string;
}

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() body: LoginDto) {
    return {
      accessToken: 'dev-token',
      user: {
        email: body.email,
        role: 'STUDENT',
      },
    };
  }
}

