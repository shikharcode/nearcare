export const meta = {
  name: 'nearcare-doctor-portal-rebuild',
  description: 'Complete doctor portal rebuild: fix profile loading bug, add doctor-prescribed medications, lab test ordering, better patient detail UI, meaningful doctor actions',
  phases: [
    { title: 'Bug Fixes', detail: 'Fix profile not loading, fix API response shapes, fix patient detail data loading' },
    { title: 'Doctor Actions', detail: 'Doctor-prescribed medications, lab test ordering, prescription generation' },
    { title: 'UI Overhaul', detail: 'Patient detail page full rebuild, doctor dashboard, profile page polish' },
    { title: 'Verify', detail: 'Adversarial review of all changed files' },
  ],
}

const CTX = `
Project: NearCare Personal Health OS. Next.js 16.3.1, React 19, TypeScript 5, Tailwind v4, @base-ui/react v1.7, @clerk/nextjs v7, Drizzle ORM + Neon, Gemini AI, Resend.
STRICT RULES:
- Auth file: src/proxy.ts NOT middleware.ts
- params in page/layout is a Promise: const { id } = await params
- DialogTrigger uses render={<Button />} NOT asChild
- PageProps global type helper — do NOT import, use explicit: ({ params }: { params: Promise<{ id: string }> })
- cn() from @/lib/utils, formatDate from @/lib/utils
- Base path: /Users/singhs1/myprod/carebridge/src/
- No TypeScript errors
- Mobile-first, 44px minimum touch targets
- "use client" components must import React hooks explicitly

DB Schema (relevant tables):
- users(id, email, name, dateOfBirth, bloodType, allergies, emergencyContact)
- doctorProfiles(id, userId, specialty, licenseNumber, hospital, phone, bio, isVerified)
- doctorPatients(id, doctorUserId, patientUserId, status, inviteToken, notes, createdAt, acceptedAt)
- doctorNotes(id, doctorUserId, patientUserId, note, isPrivate, createdAt)
- medications(id, userId, name, dosage, frequency, times, isActive, notes, startDate, endDate, prescribedBy)
- health_logs(id, userId, date, mood, energy, sleep, water, exercise, steps, weight, heartRate, systolic, diastolic, bloodSugar, temperature, oxygenSaturation, calories, symptoms, notes, painLevel)
- health_alerts(id, userId, logId, type, severity, message, value, createdAt)
- documents(id, userId, name, type, fileKey, extractedData, doctorName, date, notes)

IMPORTANT: Doctor can prescribe medications FOR a patient — this inserts into the medications table with userId = patientUserId and prescribedBy = doctorName
`

phase('Bug Fixes')

const bugFixes = await parallel([

  () => agent(CTX + `
TASK: Fix the doctor profile loading bug and clean up the profile page.

BUG: /Users/singhs1/myprod/carebridge/src/app/doctor/profile/page.tsx
The page does:
  .then((data) => {
    const p = data.profile ?? data;
    ...
  })
But /api/doctor/profile GET returns the profile object directly (not wrapped in { profile: ... }).
When profile is null, the API returns null, and data.profile ?? data = null ?? null = null — but setProfile never gets called so form stays empty with no error, making it look like "profile not loaded."

Fix:
1. Read /Users/singhs1/myprod/carebridge/src/app/doctor/profile/page.tsx
2. Fix the data parsing: if (data && typeof data === "object" && !data.error) { setProfile({ specialty: data.specialty ?? "", ... }) }
3. Add a "Profile not set up yet" message when profile is null (data is null from API) — currently it shows an empty form with no indication
4. Add an "isNew" state: if data is null, show a banner "Set up your doctor profile to start seeing patients"
5. Make the form more professional:
   - Add a doctor avatar/initials circle at top
   - Specialty should be a SELECT not free text: Cardiologist, General Physician, Endocrinologist, Orthopedic, Neurologist, Gynecologist, Dermatologist, Psychiatrist, Pediatrician, Other
   - Add "Years of experience" field
   - Add "Languages spoken" field (comma separated)
   - Style the save button as a proper gradient CTA (h-12 full width on mobile)

6. Also read /Users/singhs1/myprod/carebridge/src/app/api/doctor/profile/route.ts
   Fix GET to never return null — return {} if no profile exists so client can detect "no profile" vs error:
   return Response.json(profile || {})

Write both files.
FILE: src/app/doctor/profile/page.tsx
FILE: src/app/api/doctor/profile/route.ts
`, { label: 'fix:doctor-profile' }),

  () => agent(CTX + `
TASK: Fix and improve the doctor patient detail page.

Read /Users/singhs1/myprod/carebridge/src/app/doctor/patients/[patientId]/page.tsx

BUGS to fix:
1. The page uses useParams() to get patientId — this is fine for client component. Check the fetch URLs are correct.
2. Notes fetch: GET /api/doctor/notes?patientId=PATIENT_ID — verify this works
3. The page title shows patient email if no name — make sure fallback works

IMPROVEMENTS:
1. Make the patient header card much more prominent:
   - Large gradient banner at top with patient avatar (colored initials, 80px)
   - Show: name, email, blood type badge, allergies badge
   - Quick stats row: X logs, X medications, X alerts, member since date

2. Tabs: keep existing tabs (Overview, Logs, Medications, Alerts, Notes) but add TWO new tabs:
   - "Prescribe" tab — for doctor to add medications to patient
   - "Lab Tests" tab — for doctor to record ordered lab tests

3. PRESCRIBE TAB content (just the UI — the action button will call a new API):
   - "Prescribe Medication" form:
     * Medication name (text input with autocomplete hint)
     * Dosage (e.g. "500mg")
     * Frequency (select: Once daily / Twice daily / Three times daily / As needed)
     * Duration (e.g. "7 days", "1 month", "ongoing")
     * Instructions (textarea: "Take with food", "Avoid alcohol")
     * "Prescribe to Patient" button → POST /api/doctor/prescribe
   - Show existing prescribed medications (filter medications where prescribedBy matches doctor)
   - Each prescribed med shows: name, dosage, frequency, date prescribed, with option to "Mark Discontinued"

4. LAB TESTS TAB content:
   - "Order Lab Test" form:
     * Test name (select or free text): CBC / Blood Sugar (Fasting) / HbA1c / Lipid Profile / Thyroid Panel / Kidney Function / Liver Function / Urine Analysis / ECG / X-Ray / Other
     * Priority: Routine / Urgent
     * Instructions for patient
     * "Order Test" button → POST /api/doctor/lab-orders (creates a doctorNote with type=lab_order)
   - List of previously ordered tests for this patient (from doctorNotes where note contains lab_order JSON)

Write the complete updated patient detail page.
FILE: src/app/doctor/patients/[patientId]/page.tsx
`, { label: 'fix:patient-detail-page' }),

])

phase('Doctor Actions')

const doctorActions = await parallel([

  () => agent(CTX + `
TASK: Build doctor prescription API — doctor prescribes medications to patients.

1. Create /Users/singhs1/myprod/carebridge/src/app/api/doctor/prescribe/route.ts (POST):
   - Auth with Clerk (doctor must be authenticated)
   - Body: { patientUserId, name, dosage, frequency, duration, instructions }
   - Verify doctor has an active relationship with this patient:
     SELECT from doctorPatients where doctorUserId=userId AND patientUserId=body.patientUserId AND status="active"
   - If no relationship: return 403
   - Get doctor's profile to get their name: SELECT from doctorProfiles where userId=userId
   - Insert into medications table with:
     * userId = body.patientUserId (it goes into the PATIENT's medications)
     * name = body.name
     * dosage = body.dosage
     * frequency = body.frequency
     * prescribedBy = doctorProfile.specialty ? "Dr. [name] ([specialty])" : "Dr. [name]"
     * notes = body.instructions
     * startDate = today's date (import today from @/lib/utils)
     * isActive = true
   - Also create a doctorNote recording the prescription:
     INSERT into doctorNotes with note = JSON.stringify({ type: "prescription", medication: body.name, dosage: body.dosage, frequency: body.frequency, duration: body.duration, instructions: body.instructions })
   - Return { medication, note }

2. Create /Users/singhs1/myprod/carebridge/src/app/api/doctor/lab-orders/route.ts (POST and GET):
   POST:
   - Auth with Clerk
   - Body: { patientUserId, testName, priority, instructions }
   - Verify active doctor-patient relationship
   - Insert into doctorNotes with note = JSON.stringify({ type: "lab_order", testName: body.testName, priority: body.priority, instructions: body.instructions, orderedAt: ISO string })
   - Return { note }

   GET:
   - Auth with Clerk
   - Query param: patientId
   - Fetch doctorNotes for this doctor+patient
   - Filter and parse notes where JSON.parse(note).type === "lab_order"
   - Return { labOrders: [...] }

Return:
FILE: src/app/api/doctor/prescribe/route.ts
FILE: src/app/api/doctor/lab-orders/route.ts
`, { label: 'action:prescribe-laborders' }),

  () => agent(CTX + `
TASK: Rebuild the doctor dashboard and profile page for a meaningful, professional experience.

1. Read /Users/singhs1/myprod/carebridge/src/app/doctor/page.tsx
   Complete rewrite with meaningful content:

   HEADER: "Welcome back, Dr. [Name]" with specialty and hospital from profile
   If no profile set up: show prominent onboarding banner "Complete your profile to start seeing patients →"

   STATS ROW (4 cards):
   - Total active patients
   - Pending invites
   - Critical alerts across all patients (count patients with any critical alert)
   - Notes written this week

   RECENT ACTIVITY (most useful part):
   - List of patients who logged health data TODAY or YESTERDAY — "Recent Activity" section
   - For each: patient name + what changed (e.g. "Sarah logged vitals — BP 145/92 ⚠️")
   - Click → goes to patient detail

   CRITICAL ALERTS SECTION:
   - Patients with critical/warning alerts — show prominently
   - Alert message + patient name + time
   - "View Patient" button

   QUICK ACTIONS:
   - "Invite New Patient" → opens invite dialog
   - "View All Patients" → /doctor/patients
   - "My Profile" → /doctor/profile

2. Read /Users/singhs1/myprod/carebridge/src/app/doctor/layout.tsx
   Update the active nav link highlighting — use usePathname on the nav links.
   The layout is a server component but the nav links need client-side active state.
   Create /Users/singhs1/myprod/carebridge/src/app/doctor/doctor-nav.tsx ("use client") — extract just the nav links with usePathname highlighting.
   Import and use it in the layout.

Return:
FILE: src/app/doctor/page.tsx
FILE: src/app/doctor/layout.tsx
FILE: src/app/doctor/doctor-nav.tsx
`, { label: 'action:doctor-dashboard' }),

])

phase('UI Overhaul')

const uiOverhaul = await parallel([

  () => agent(CTX + `
TASK: Polish the doctor patients list page and make it more useful.

Read /Users/singhs1/myprod/carebridge/src/app/doctor/patients/page.tsx

Improvements:
1. The patient cards should show MUCH more useful info:
   - Last vital logged + key value (e.g. "BP: 145/92 ⚠️" or "Blood Sugar: 185 mg/dL")
   - Days since last log (e.g. "Last active: 2 days ago" or "No logs yet")
   - Medication count + adherence indicator (green/amber/red dot)
   - Alert severity indicator (red badge if critical alerts exist)

2. Sort options: "Most Recent Activity" (default) / "Alerts First" / "Alphabetical"

3. Empty state improvement: When no patients, show a more engaging empty state with:
   - Illustration (large stethoscope icon in gradient circle)
   - "Start monitoring your first patient" heading
   - Step-by-step: "Send invite → Patient accepts → View their health data"
   - Large "Invite First Patient" CTA

4. The invite dialog: improve it
   - After generating invite link, show a WhatsApp share button:
     window.open("https://wa.me/?text=" + encodeURIComponent("I'd like to monitor your health on NearCare. Click to accept: " + inviteLink))
   - Also a "Copy & Send via Email" button

5. Pending invites tab: already built but improve:
   - Show elapsed time since invite sent ("Sent 3 days ago")
   - Show if invite is close to expiry (if you add expiry later)

Write the complete updated file.
FILE: src/app/doctor/patients/page.tsx
`, { label: 'ui:patients-list' }),

])

phase('Verify')

const verifyTargets = [
  { path: 'src/app/api/doctor/prescribe/route.ts', focus: 'auth, active relationship check, correct table fields, prescribedBy format' },
  { path: 'src/app/api/doctor/lab-orders/route.ts', focus: 'auth, JSON storage in notes, GET filter logic' },
  { path: 'src/app/doctor/patients/[patientId]/page.tsx', focus: 'useParams correct, fetch URLs, new tab content wired to APIs' },
  { path: 'src/app/api/doctor/profile/route.ts', focus: 'returns empty object not null, no breaking changes' },
]

const verifications = await parallel(verifyTargets.map(t => () => agent(CTX + `
Adversarial code review of /Users/singhs1/myprod/carebridge/${t.path}
Focus: ${t.focus}

Read the file. Check for:
1. TypeScript errors — wrong types, missing imports
2. Auth — is every endpoint properly protected?
3. Logic — correct DB field names, null safety, missing awaits
4. The prescribe route: does it correctly set userId = patientUserId (not doctorUserId)?
5. Missing error handling at API boundaries

LINE | ISSUE | FIX
CLEAN if no issues.
`, { label: 'verify:' + t.path.split('/').pop(), phase: 'Verify' })))

return {
  bugFixes: bugFixes.filter(Boolean).length,
  doctorActions: doctorActions.filter(Boolean).length,
  uiOverhaul: uiOverhaul.filter(Boolean).length,
  verified: verifications.filter(Boolean).length,
  done: true,
}
