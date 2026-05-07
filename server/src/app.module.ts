import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { RateLimitingModule } from './core/rate-limiting/rate-limiting.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkshopModule } from './modules/workshop/workshop.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { PaymentModule } from './modules/payment/payment.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { NotificationModule } from './modules/notification/notification.module';
import { StudentSyncModule } from './modules/student-sync/student-sync.module';
import { AiSummaryModule } from './modules/ai-summary/ai-summary.module';
import { StudentsModule } from './modules/students/students.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    RateLimitingModule,
    HealthModule,
    AuthModule,
    WorkshopModule,
    RegistrationModule,
    PaymentModule,
    CheckinModule,
    NotificationModule,
    StudentSyncModule,
    AiSummaryModule,
    StudentsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
