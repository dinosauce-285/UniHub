import { ServiceUnavailableException } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from '../redis/redis.service';

const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'updatedAt')
local tokens = tonumber(bucket[1])
local updatedAt = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
end

if updatedAt == nil then
  updatedAt = now
end

local elapsed = math.max(0, now - updatedAt)
local refillRate = capacity / ttl
tokens = math.min(capacity, tokens + (elapsed * refillRate))

local allowed = 0
local retryAfterMs = 0

if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
else
  retryAfterMs = math.ceil((1 - tokens) / refillRate)
end

local timeToFullMs = math.ceil((capacity - tokens) / refillRate)
local totalHits = capacity - math.floor(tokens)

if allowed == 0 then
  totalHits = capacity + 1
end

redis.call('HMSET', key, 'tokens', tokens, 'updatedAt', now)
redis.call('PEXPIRE', key, math.max(ttl, retryAfterMs) * 2)

return {
  totalHits,
  math.max(1, math.ceil(timeToFullMs / 1000)),
  1 - allowed,
  math.max(1, math.ceil(retryAfterMs / 1000))
}
`;

type TokenBucketResult = [number | string, number | string, number | string, number | string];

export class RedisTokenBucketStorage implements ThrottlerStorage {
  private readonly commandTimeoutMs = 750;

  constructor(private readonly redisService: RedisService) {}

  async increment(key: string, ttl: number, limit: number) {
    const client = this.redisService.getClient();

    try {
      const result = await this.withTimeout(
        client.eval(TOKEN_BUCKET_SCRIPT, 1, key, limit, ttl, Date.now()),
      );
      const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] =
        result as TokenBucketResult;

      return {
        totalHits: Number(totalHits),
        timeToExpire: Number(timeToExpire),
        isBlocked: Number(isBlocked) === 1,
        timeToBlockExpire: Number(timeToBlockExpire),
      };
    } catch {
      throw new ServiceUnavailableException(
        'Rate limiting is temporarily unavailable.',
      );
    }
  }

  private withTimeout<T>(promise: Promise<T>) {
    let timeout: ReturnType<typeof setTimeout>;

    const timeoutPromise = new Promise<T>((_resolve, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('Redis rate limit command timed out'));
      }, this.commandTimeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timeout);
    });
  }
}
