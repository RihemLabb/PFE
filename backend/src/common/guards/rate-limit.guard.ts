import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitRequest {
  ip?: string;
  method?: string;
  originalUrl?: string;
  route?: { path?: string };
  socket?: { remoteAddress?: string | null };
}

interface RateLimitResponse {
  setHeader?: (name: string, value: string) => void;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private lastCleanupAt = 0;
  private readonly cleanupIntervalMs = 60_000;

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) return true;

    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const response = context.switchToHttp().getResponse<RateLimitResponse>();
    const now = Date.now();

    this.cleanupExpired(now);

    const tracker =
      request.ip ?? request.socket?.remoteAddress ?? 'unknown-client';
    const path =
      request.originalUrl?.split('?')[0] ?? request.route?.path ?? 'unknown';
    const key = `${request.method ?? 'REQUEST'}:${path}:${tracker}`;
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return true;
    }

    if (bucket.count >= options.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000),
      );
      response.setHeader?.('Retry-After', String(retryAfterSeconds));

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    return true;
  }

  private cleanupExpired(now: number) {
    if (now - this.lastCleanupAt < this.cleanupIntervalMs) return;

    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }

    this.lastCleanupAt = now;
  }
}
