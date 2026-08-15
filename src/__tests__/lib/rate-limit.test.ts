import { describe, it, expect, beforeEach } from "vitest"
import { checkRateLimit } from "@/lib/rate-limit"

// rate-limit.ts uses a module-level Map, so we re-import a fresh module
// between describe blocks. To keep tests self-contained and isolated we
// rely on unique userId+route keys per test so the shared Map state does
// not bleed across cases.

const USER_A = "user_rate_a"
const USER_B = "user_rate_b"
const ROUTE_1 = "/api/route-one"
const ROUTE_2 = "/api/route-two"
const COOLDOWN = 1000 // 1 second

describe("checkRateLimit()", () => {
  it("first call for a new userId+route is allowed", () => {
    const result = checkRateLimit(`${USER_A}_first`, ROUTE_1, COOLDOWN)
    expect(result.allowed).toBe(true)
    expect(result.retryAfterMs).toBe(0)
  })

  it("second call within cooldown is blocked with retryAfterMs > 0", () => {
    const userId = `${USER_A}_within`
    checkRateLimit(userId, ROUTE_1, COOLDOWN) // first call
    const result = checkRateLimit(userId, ROUTE_1, COOLDOWN) // immediate second call
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it("second call after cooldown expires is allowed", async () => {
    const userId = `${USER_A}_after`
    const shortCooldown = 30 // 30 ms — short enough to expire quickly
    checkRateLimit(userId, ROUTE_1, shortCooldown) // first call
    await new Promise((resolve) => setTimeout(resolve, shortCooldown + 20))
    const result = checkRateLimit(userId, ROUTE_1, shortCooldown)
    expect(result.allowed).toBe(true)
    expect(result.retryAfterMs).toBe(0)
  })

  it("different users do not share rate limits", () => {
    const route = "/api/shared-route"
    checkRateLimit(`${USER_A}_diff_users`, route, COOLDOWN) // consume USER_A's slot
    // USER_B has never called this route, so it must be allowed
    const result = checkRateLimit(`${USER_B}_diff_users`, route, COOLDOWN)
    expect(result.allowed).toBe(true)
  })

  it("different routes do not share rate limits for the same user", () => {
    const userId = `${USER_A}_diff_routes`
    checkRateLimit(userId, ROUTE_1, COOLDOWN) // consume ROUTE_1 slot
    // ROUTE_2 has never been called for this user, so it must be allowed
    const result = checkRateLimit(userId, ROUTE_2, COOLDOWN)
    expect(result.allowed).toBe(true)
  })

  it("retryAfterMs is approximately equal to cooldownMs on an immediate second call", () => {
    const userId = `${USER_A}_retry_ms`
    const cooldown = 500
    checkRateLimit(userId, ROUTE_1, cooldown) // first call
    const result = checkRateLimit(userId, ROUTE_1, cooldown) // immediate second call
    // Allow up to 50 ms of elapsed time between the two calls
    expect(result.retryAfterMs).toBeGreaterThan(cooldown - 50)
    expect(result.retryAfterMs).toBeLessThanOrEqual(cooldown)
  })

  it("a blocked call does not reset the cooldown timer", async () => {
    const userId = `${USER_A}_no_reset`
    const shortCooldown = 80
    checkRateLimit(userId, ROUTE_1, shortCooldown) // t=0, sets timer
    checkRateLimit(userId, ROUTE_1, shortCooldown) // t~0, blocked — must NOT reset timer
    await new Promise((resolve) => setTimeout(resolve, shortCooldown + 20))
    // Timer was set at t=0; after cooldown+20 ms it should be expired
    const result = checkRateLimit(userId, ROUTE_1, shortCooldown)
    expect(result.allowed).toBe(true)
  })
})
