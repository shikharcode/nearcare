const lastCallMap = new Map<string, number>();

export function checkRateLimit(
  userId: string,
  route: string,
  cooldownMs: number
): { allowed: boolean; retryAfterMs: number } {
  const key = userId + ":" + route;
  const now = Date.now();
  const lastCall = lastCallMap.get(key);

  if (lastCall !== undefined && now - lastCall < cooldownMs) {
    return { allowed: false, retryAfterMs: cooldownMs - (now - lastCall) };
  }

  lastCallMap.set(key, now);
  return { allowed: true, retryAfterMs: 0 };
}
