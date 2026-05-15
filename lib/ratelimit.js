import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = hasUpstash ? Redis.fromEnv() : null

// 20 requests per minute per key. Adjust per-endpoint by creating
// additional instances with different limiters.
export const aiRatelimit = hasUpstash
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
      prefix: 'rl:ai',
    })
  : null

function getClientKey(req) {
  const forwarded = req.headers['x-forwarded-for']
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : null) ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'anonymous'
  return String(ip).trim()
}

// Returns { ok: true } when allowed, or { ok: false, retryAfter } when blocked.
// No-ops to { ok: true } if Upstash env vars are missing (dev/preview safety).
export async function enforceAiRateLimit(req) {
  if (!aiRatelimit) return { ok: true }
  const key = getClientKey(req)
  const result = await aiRatelimit.limit(key)
  if (result.success) return { ok: true, remaining: result.remaining }
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
  return { ok: false, retryAfter, limit: result.limit }
}
