# NearCare — TODO & Roadmap

## 🔴 High Priority (before launch)

- [ ] **ABHA Real Integration** — Current implementation is a placeholder (localStorage only). Real integration requires:
  - Register as Health Information Provider (HIP) at abdm.gov.in
  - Get ABDM sandbox credentials (CLIENT_ID + CLIENT_SECRET)
  - Implement OAuth flow: user logs into ABHA → grants permission → NearCare pulls records
  - Pull health records via FHIR R4 from Health Information Exchange
  - Comply with DPDP Act (India data protection)
  - Start at: sandbox.abdm.gov.in
  - File to update: src/app/api/abha/verify/route.ts + src/app/dashboard/profile/abha/page.tsx

- [ ] **Set NEXT_PUBLIC_APP_URL in Vercel** — currently unset, breaks invite links in production
  - Go to Vercel → nearcare → Settings → Environment Variables
  - Add: NEXT_PUBLIC_APP_URL = https://nearcare.vercel.app

- [ ] **Rotate exposed API keys** — keys were briefly visible in terminal during setup
  - Rotate: CLERK_SECRET_KEY, DATABASE_URL password, R2_SECRET_ACCESS_KEY

- [ ] **Clerk production instance** — currently using dev instance (pk_test_...)
  - Create production Clerk instance at clerk.com
  - Update NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY in Vercel

- [ ] **Resend domain verification** — onboarding@resend.dev only works for account owner email
  - Verify a custom domain in Resend (e.g. alerts@nearcare.app)
  - Update RESEND_FROM_EMAIL in Vercel env vars

## 🟡 Medium Priority (next sprint)

- [ ] **Smart alert noise reduction** — HR alert during exercise is filtered, but BP alerts for single readings
  - Only alert BP if elevated in 2+ consecutive logs
  - File: src/lib/alerts.ts checkThresholds()

- [ ] **Wearable sync** — Apple Watch / Fitbit / Google Fit live sync (currently only manual import)
  - Apple HealthKit requires iOS app (React Native or Flutter)
  - Fitbit OAuth API available free

- [ ] **PWA icon files** — manifest.json references /icon-192.png and /icon-512.png which don't exist yet
  - Create and add actual NearCare icon files to /public/

- [ ] **Delete health log API** — src/app/api/health-logs/[id]/route.ts exists but needs verification
  - Test delete from history page works end to end

- [ ] **Neon dev branch** — local dev hits production DB
  - Create dev branch in Neon console
  - Use dev branch URL in .env.local
  - Keep production URL only in Vercel

- [ ] **CRON_SECRET in Vercel** — medication reminders + weekly digest won't run without it
  - Add CRON_SECRET env var in Vercel dashboard (any random string)

## 🟢 Feature Suggestions (post-launch)

- [ ] **Hospital integration** — HL7/FHIR standard, requires empanelment agreements. 2-3 years out for startup.

- [ ] **React Native app** — for Play Store / App Store. Current PWA works but native app needed for:
  - Apple HealthKit access
  - Push notifications (real-time alerts)
  - Background sync

- [ ] **Caregiver mode improvement** — currently token-based, no login. Add:
  - Caregiver can create their own account
  - Multiple patients per caregiver
  - Caregiver dashboard

- [ ] **Multi-language support** — Gemini can respond in any language
  - Add language preference to profile (Hindi, Tamil, Telugu, etc.)
  - Pass language instruction to all AI prompts

- [ ] **Doctor verification** — currently anyone can use the doctor portal
  - Verify via medical council registration number (NMC India)
  - Badge verified doctors differently

- [ ] **Subscription / monetization** — current stack is $0/month free tier
  - Gate: AI Chat, anomaly detection, unlimited documents behind paid plan
  - Pricing idea: ₹99/month individual, ₹199/month family

- [ ] **Medication refill reminders** — times field in medications is stored but never used for scheduling
  - Send Resend email at scheduled times for each medication

- [ ] **Emergency contacts improvement** — SOS sends email only
  - Add SMS via Twilio / MSG91 (Indian SMS provider)
  - WhatsApp alerts via WhatsApp Business API

## 📝 Technical Debt

- [ ] **gemma-4-26b** — added to model registry (14,400 RPD free) but not used anywhere yet
  - Use for bulk background tasks, digest generation for many users

- [ ] **Anomaly detection minimum** — requires 7 logs, could be smarter with fewer logs for new users
  
- [ ] **health-logs API limit** — currently 500 max, streak needs all-time data
  - Add a separate lightweight endpoint just for dates (SELECT date FROM health_logs)

- [ ] **Error boundary** — root error.tsx added but individual page error.tsx files exist
  - Test that errors are caught correctly in production

- [ ] **Analytics events** — lib/analytics.ts created but not called from any pages yet
  - Wire trackHealthLogSaved(), trackMedicationAdded(), trackCheckinCompleted() etc.
