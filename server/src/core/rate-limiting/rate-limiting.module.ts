import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';
import {
  RATE_LIMIT_ERROR_MESSAGE,
  RATE_LIMIT_POLICIES,
} from './rate-limit.constants';
import { RateLimitingGuard } from './rate-limiting.guard';
import { RedisTokenBucketStorage } from './redis-token-bucket.storage';

@Module({
  imports: [
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');

        if (!secret || secret === 'replace-me') {
          throw new Error('JWT_SECRET must be configured for JWT authentication');
        }

        return { secret };
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: [
          {
            name: 'default',
            limit: RATE_LIMIT_POLICIES.global.limit,
            ttl: RATE_LIMIT_POLICIES.global.ttl,
          },
        ],
        storage: new RedisTokenBucketStorage(redisService),
        errorMessage: RATE_LIMIT_ERROR_MESSAGE,
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitingGuard,
    },
  ],
})
export class RateLimitingModule {}
