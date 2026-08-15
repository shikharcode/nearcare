import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "user_test123", fullName: "Test User", firstName: "Test" }, isLoaded: true }),
  useAuth: () => ({ userId: "user_test123", isSignedIn: true }),
  UserButton: () => null,
  SignOutButton: ({ children }: any) => children,
  ClerkProvider: ({ children }: any) => children,
}))

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => Promise.resolve({ userId: "user_test123" }),
  currentUser: () => Promise.resolve({ id: "user_test123", fullName: "Test User", firstName: "Test", emailAddresses: [{ emailAddress: "test@test.com" }] }),
  clerkMiddleware: (fn: any) => fn,
}))

// Mock DB
vi.mock("@/db", () => {
  const limit = vi.fn(() => Promise.resolve([]))
  const orderBy = vi.fn(() => ({ limit }))
  const selectWhere = vi.fn(() => ({ orderBy }))
  const from = vi.fn(() => ({ where: selectWhere }))
  const select = vi.fn(() => ({ from }))

  const returning = vi.fn(() => Promise.resolve([{}]))
  const onConflictDoNothing = vi.fn(() => Promise.resolve())
  const values = vi.fn(() => ({ returning, onConflictDoNothing }))
  const insert = vi.fn(() => ({ values }))

  const updateReturning = vi.fn(() => Promise.resolve([{}]))
  const updateWhere = vi.fn(() => ({ returning: updateReturning }))
  const set = vi.fn(() => ({ where: updateWhere }))
  const update = vi.fn(() => ({ set }))

  const deleteWhere = vi.fn(() => Promise.resolve())
  const del = vi.fn(() => ({ where: deleteWhere }))

  return {
    db: { select, insert, update, delete: del },
  }
})

// Mock Resend
vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: { send: vi.fn(() => Promise.resolve({ id: "email_test" })) },
  })),
}))
