function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const RATE_LIMIT_POLICIES = {
  global: {
    limit: parsePositiveInteger(process.env.RATE_LIMIT_GLOBAL_LIMIT, 20),
    ttl: parsePositiveInteger(process.env.RATE_LIMIT_GLOBAL_TTL_MS, 10_000),
  },
  registrationWrite: {
    limit: 10,
    ttl: 10_000,
  },
  workshopRead: {
    limit: 100,
    ttl: 60_000,
  },
} as const;

export const RATE_LIMIT_ERROR_MESSAGE =
  'Too many requests. Please retry later.';
