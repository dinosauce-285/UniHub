import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from '@nestjs/throttler';

type JwtTrackerPayload = {
  id?: unknown;
};

@Injectable()
export class RateLimitingGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions()
    options: ThrottlerModuleOptions,
    @InjectThrottlerStorage()
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = this.getAuthenticatedUserId(req);
    if (userId) {
      return `user:${userId}`;
    }

    return `ip:${this.getClientIp(req)}`;
  }

  private getAuthenticatedUserId(req: Record<string, any>) {
    if (typeof req.user?.id === 'string') {
      return req.user.id;
    }

    const authHeader = req.headers?.authorization;
    if (typeof authHeader !== 'string') {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    try {
      const payload = this.jwtService.verify<JwtTrackerPayload>(token);
      return typeof payload.id === 'string' ? payload.id : null;
    } catch {
      return null;
    }
  }

  private getClientIp(req: Record<string, any>) {
    const forwardedFor = req.headers?.['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return forwardedFor.split(',')[0].trim();
    }

    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }
}
