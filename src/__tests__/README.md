# NearCare Test Suite

## Running Tests
- `npm run test` — watch mode
- `npm run test:run` — single run
- `npm run test:coverage` — with coverage report
- `npm run test:e2e` — Playwright E2E (needs `npm run dev` running)

## Test Structure
- `src/__tests__/lib/` — unit tests for lib functions
- `src/__tests__/api/` — API route handler tests
- `e2e/` — Playwright end-to-end tests

## Coverage Targets
- `lib/alerts.ts` — 100% branch coverage (health logic is critical)
- `lib/utils.ts` — 100%
- `lib/rate-limit.ts` — 100%
- `api/abha/verify` — 100% (validates Indian health ID format)
- `api/doctor/prescribe` — 100% (security critical)

## Mocking Strategy
- DB (Drizzle): mocked in `setup.ts` — tests don't hit real Neon
- Clerk auth: mocked to return `user_test123`
- Resend: mocked — no real emails sent during tests
- Gemini AI: mock in individual test files using `vi.mock("@/lib/gemini")`
