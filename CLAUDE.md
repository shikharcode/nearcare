@AGENTS.md

# CareBridge — CLAUDE.md

Personal Health OS. Next.js 16 app with AI-powered health tracking, medication management, document storage, and doctor sharing.

---

## Stack (exact versions)

- **Framework:** Next.js 16.3.1 (App Router) — read AGENTS.md, this is NOT standard Next.js
- **Language:** TypeScript 5, React 19
- **Styling:** Tailwind v4 + `tw-animate-css` + `tailwind-merge` + `clsx`
- **UI components:** `@base-ui/react` v1.7 via shadcn — NOT Radix UI
- **Auth:** `@clerk/nextjs` v7 — uses `src/proxy.ts`, NOT `middleware.ts`
- **DB:** Neon (serverless Postgres) + Drizzle ORM v0.45
- **AI:** `@google/generative-ai` v0.24 — use `gemini-flash-lite-latest` model only
- **Storage:** Cloudflare R2 via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- **Email:** Resend v6
- **Forms:** react-hook-form v7 + zod v3 + `@hookform/resolvers`
- **Charts:** Recharts v3
- **Toasts:** Sonner v2
- **Dates:** date-fns v4

---

## Project Structure

```
src/
  app/                   # Next.js App Router pages
    api/                 # API routes
    dashboard/           # Protected dashboard routes
    onboarding/
    share/               # Public doctor share pages
    sign-in/ sign-up/
  components/
    dashboard/
    documents/
    health/
    medications/
    shared/
    ui/                  # shadcn base-ui components
  db/
    index.ts             # Drizzle client
    schema.ts            # All table definitions
  lib/
    gemini.ts            # Gemini AI helpers
    r2.ts                # Cloudflare R2 helpers
    alerts.ts            # Health alert logic
    utils.ts             # cn() and shared utils
  proxy.ts               # Clerk auth middleware (NOT middleware.ts)
  types/
```

---

## Critical Gotchas

### Clerk Auth
- The auth file is `src/proxy.ts`, not `src/middleware.ts`
- Public paths: `/`, `/sign-in`, `/sign-up`, `/share/*`
- All other routes are protected via `auth.protect()`
- Never rename or move `proxy.ts`

### Gemini AI
- **Only use `gemini-flash-lite-latest`** — flash and pro hit free-tier quota limits
- For JSON responses, use `responseMimeType: "application/json"` on the model config to prevent markdown fences in output
- Two model instances in `lib/gemini.ts`: one for text, one (`jsonModel`) for structured JSON

### base-ui (shadcn) Components
- This is `@base-ui/react`, NOT Radix UI — APIs differ
- `DialogTrigger` uses `render={<Button />}` prop pattern, not `asChild`
- Check `src/components/ui/` for existing components before creating new ones

### Next.js 16 / React 19
- `LayoutProps` and `PageProps` are global type helpers — no import needed
- `params` in page/layout components is a `Promise` — must be awaited: `const { id } = await params`
- Use `"use client"` directive only when needed (interactivity, hooks, browser APIs)
- Hydration warning from Grammarly extension is harmless — suppressed with `suppressHydrationWarning` on `<body>`

### Tailwind v4
- No `tailwind.config.js` — configuration is in CSS via `@theme` and `@layer`
- Use `cn()` from `lib/utils.ts` for conditional classes

---

## Database

Schema file: `src/db/schema.ts`

Tables:
- `users` — Clerk user ID as PK, profile fields
- `health_logs` — daily vitals (mood, energy, sleep, BP, blood sugar, etc.)
- `medications` — medication definitions, `times` stored as JSON string array
- `medication_logs` — daily taken/skipped records
- `documents` — file metadata, R2 key, Gemini-extracted data as JSON string
- `share_links` — doctor share tokens with optional expiry
- `family_contacts` — caregivers/family for alert notifications
- `health_alerts` — triggered alerts with severity (warning/critical)
- `doctor_profiles` — doctor metadata for verified doctor accounts
- `doctor_patients` — doctor↔patient relationship with invite token
- `doctor_notes` — private/shared notes from doctor to patient

DB commands:
```bash
npm run db:push       # push schema changes to Neon (dev)
npm run db:generate   # generate migration files
npm run db:studio     # open Drizzle Studio
```

---

## Environment Variables

All in `.env.local`. Required keys:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `DATABASE_URL` (Neon connection string)
- `GEMINI_API_KEY`
- `CLOUDFLARE_R2_*` (account ID, bucket, access key, secret key, public URL)
- `RESEND_API_KEY`

---

## Features Built

- Landing page + Clerk sign-in/sign-up → `/dashboard`
- Dashboard overview with health stats
- Daily health log (mood, energy, sleep, water, exercise, vitals)
- Medication tracker with daily check-in + progress ring
- Scan prescription image → Gemini extracts meds → add all in one click
- OpenFDA autocomplete for medication name input
- Document upload (R2) + Gemini text extraction
- AI weekly health insights (Gemini)
- Doctor share link (read-only, token-based)
- Dark/light theme toggle (next-themes, moon/sun icon in sidebar)
- Mobile-responsive: bottom nav on mobile, sidebar on desktop
- Health alerts with email via Resend
- Family contacts for caregiver notifications
- Doctor portal (doctor_profiles, doctor_patients, doctor_notes)

---

## Dev

```bash
npm run dev    # start dev server on localhost:3000
npm run build  # production build
npm run lint   # eslint
```
