# NearCare — Complete Use Cases

## Who Uses NearCare

Three primary user types:
1. **Patient** — person tracking their own health (or elderly person whose family tracks for them)
2. **Family Caregiver** — son/daughter/spouse monitoring a family member remotely
3. **Doctor** — physician monitoring multiple patients between clinic visits

---

## Use Case Tree

### 1. PATIENT USE CASES

#### 1.1 Daily Health Monitoring
- 1.1.1 Log daily vitals (BP, blood sugar, heart rate, SpO2, weight, temperature)
  - How: Health Log page, Quick Check-in (30 sec), Voice input, Natural language text
  - Who benefits: Patient gets trend awareness; doctor sees data between visits; family gets alerts
  - Example: "Rajan, 62, logs BP every morning before his walk. His cardiologist sees the trend without a visit."

- 1.1.2 Track sleep, mood, energy, water intake
  - How: Health Log form fields
  - Who benefits: AI detects correlations (poor sleep → elevated BP next day)

- 1.1.3 Log symptoms and notes
  - How: Text fields in health log, Voice input
  - Who benefits: Doctor can see "3 days of fatigue before the critical alert" in context

#### 1.2 Medication Management
- 1.2.1 Track all medications with times and dosage
  - How: Medications page, add manually or scan prescription photo
  - Example: Metformin 500mg BD, Amlodipine 5mg OD

- 1.2.2 Daily medication check-in
  - How: Medications page, Quick Check-in step 3
  - Why: 50% of chronic disease patients stop medications within 6 months — this prevents it

- 1.2.3 Check for drug interactions before adding a new medication
  - How: Automatic on every medication addition — Gemini AI checks against all current meds
  - Example: Adding aspirin when already on warfarin triggers "moderate interaction — bleeding risk" warning

- 1.2.4 Find generic alternatives to save money
  - How: "Check Price" button on each medication
  - Example: Brand Glucophage → Generic Metformin 60% cheaper, links to 1mg + PharmEasy

- 1.2.5 Scan a physical prescription to auto-add medications
  - How: Scan button on medications page, camera captures prescription image, Gemini extracts meds
  - Example: Doctor gives handwritten prescription → user photos it → all 4 meds added in one tap

#### 1.3 Documents and Records
- 1.3.1 Upload lab reports, prescriptions, scans
  - How: Documents page, drag-and-drop or camera
  - Storage: Cloudflare R2 (permanent), AI extracts key data on upload

- 1.3.2 AI extraction of document data
  - How: Automatic on every upload — Gemini reads the document
  - What it extracts: doctor name, diagnosis, medications, lab values, date, instructions
  - Example: HbA1c lab report → AI shows "7.2% — slightly elevated, consistent with pre-diabetes"

- 1.3.3 View all document history in one place
  - How: Documents page with type filters (Prescription/Lab/Scan/Other)

#### 1.4 AI Features
- 1.4.1 Weekly AI health summary
  - How: Insights page → "Generate" button, sent by email every Monday
  - Output: Overall health score 1-10, highlights, concerns, patterns, recommendations
  - Tailored to: Indian lifestyle (diet, seasonal illnesses, common conditions like diabetes/hypertension)

- 1.4.2 Chat with your health data
  - How: AI Chat page — ask anything about your health
  - Examples: "Why is my BP trending up?", "Am I taking my meds regularly?", "What patterns do you see?"
  - Context: Gemini sees your last 30 logs + active medications + recent alerts

- 1.4.3 Anomaly detection (automatic, no action needed)
  - How: Runs silently after every health log save
  - Examples: "BP has been creeping up 5 points per week for 3 weeks", "Sleep consistently under 6 hours"
  - Output: Saved as health alerts, visible on anomalies page

- 1.4.4 Appointment preparation
  - How: Appointment Prep page, select doctor type → AI generates briefing
  - Output: Chief complaints, vitals to discuss, medication questions, 5 questions to ask your doctor, specialist suggestion
  - Example: "Your BP has been elevated — ask your cardiologist about adjusting Amlodipine dosage"

- 1.4.5 Natural language health logging
  - How: AI Fill box on health log page
  - Example: "I slept 7 hours, had chai and daal for lunch, BP was 135/88, feeling okay" → auto-fills all fields

- 1.4.6 Voice health logging
  - How: Microphone button on health log
  - Example: Speak "Slept 6 hours, blood sugar 185, took all meds" → AI parses → form fills
  - Works in Indian English accents (en-IN)

#### 1.5 Trends and History
- 1.5.1 Visual trends over 7/30/90 days
  - How: Trends page — 6 Recharts graphs (BP, HR, blood sugar, weight, sleep, mood)
  - Reference bands show normal ranges, color-coded alerts

- 1.5.2 Full health log history with export
  - How: History page — sortable table, critical values highlighted in red/yellow, CSV export

- 1.5.3 30-day mood calendar heatmap
  - How: Health log page, calendar grid colored by mood value

#### 1.6 Sharing and Access
- 1.6.1 Health Passport for doctor visits
  - How: Health Passport page, printable/shareable
  - Contains: emergency info, active medications, 30-day vitals averages, symptoms, documents list

- 1.6.2 Share read-only link with any doctor
  - How: Share page → create link → send to doctor
  - Doctor sees: patient info, medications, last 10 logs, documents (if enabled)
  - No NearCare account required for doctor to view

- 1.6.3 Link ABHA (Ayushman Bharat Health Account) ID
  - How: Profile → ABHA page
  - Why: Government digital health ID — future hospital integration
  - Currently: stores ID locally, live government sync coming

#### 1.7 Offline and Mobile
- 1.7.1 Install as app on phone (PWA)
  - How: "Add to Home Screen" in browser
  - Works on: iPhone, Android, desktop

- 1.7.2 Log health offline
  - How: App works without internet, queues data, syncs when reconnected
  - Why: Rural users, poor connectivity areas

---

### 2. FAMILY CAREGIVER USE CASES

#### 2.1 Remote Monitoring
- 2.1.1 Get real-time alerts when family member's vitals are critical
  - How: Add yourself as family contact → enable alerts → get email instantly
  - Triggers: BP > 180, blood sugar < 70, SpO2 < 90, pain level >= 7
  - Smart: HR alert suppressed during exercise (no false alarms)
  - Example: Son in Bangalore gets email "Mom's BP is critically high — 182/115 mmHg"

- 2.1.2 SOS emergency alert
  - How: Red pulsing SOS button always visible on every page
  - On tap: confirms → sends emergency email to ALL family contacts with latest vitals
  - Example: Elderly patient feels unwell → taps SOS → entire family notified in seconds

#### 2.2 Caregiver Mode
- 2.2.1 Log health on behalf of elderly parent
  - How: Family page → Generate Caregiver Link → share with caregiver
  - Caregiver opens link (no login required) → simplified large-text form → submits
  - Data appears in patient's account as if they logged it themselves
  - Example: Nurse visits home, logs BP and medications via caregiver link on her phone

- 2.2.2 Manage multiple family members
  - How: Multiple family contacts, each with individual alert preferences

---

### 3. DOCTOR USE CASES

#### 3.1 Standard Patient Monitoring (invite-based)
- 3.1.1 Invite existing patients to share their data
  - How: Doctor portal → Invite Patient → enter email → send WhatsApp/email link
  - Patient accepts → doctor sees their full health dashboard
  - Use case: Patient already uses NearCare, wants to share with new specialist

- 3.1.2 View patient vitals between clinic visits
  - How: Doctor portal → patient detail → Overview tab
  - See: latest vitals, BP trend, medication adherence, recent alerts

- 3.1.3 Prescribe medications digitally
  - How: Doctor portal → patient → Prescribe tab → fill form → "Prescribe"
  - Medication appears instantly in patient's medication list with "Dr. Name (Specialty)"
  - Print prescription with one click

- 3.1.4 Order lab tests
  - How: Doctor portal → patient → Lab Tests tab → select test (CBC, HbA1c, etc.) → mark priority
  - Creates a record visible to patient

- 3.1.5 Write clinical notes
  - How: Doctor portal → patient → Notes tab
  - Private notes (only doctor sees) or shared notes (patient can see)

#### 3.2 Doctor-Created Profiles (NEW — no invite needed)
- 3.2.1 Create patient profile directly in clinic
  - How: Doctor portal → Offline Patients → Add Patient → fill form
  - No smartphone/email needed from patient
  - Doctor enters: name, DOB, blood type, allergies, emergency contact
  - Use case: Elderly patient has no smartphone. Doctor creates profile in 2 minutes.

- 3.2.2 Enter historical vitals for new patient
  - How: Managed patient → Vitals tab → Add Vitals
  - Doctor enters last 3-6 months of BP readings, blood sugar, etc. from paper records
  - Creates immediate health history baseline

- 3.2.3 Add medications for unregistered patient
  - How: Managed patient → Medications tab → Add Medication
  - Stored as doctor records, transfers to patient account when claimed

- 3.2.4 Share claim link with patient/family
  - How: Copy claim link from patient card → send via WhatsApp
  - Patient opens link → one click → account created → all data migrated
  - Example: Doctor creates profile for Mr. Rajan. His daughter Priya gets the link → claims it → starts home monitoring.

- 3.2.5 Patient claims profile from home
  - How: Patient opens /claim/[token] → signs up/in → "Claim Profile" → redirected to dashboard
  - All vitals, medications, notes entered by doctor are now in their account
  - Doctor automatically becomes their connected doctor (doctorPatients relationship created)

#### 3.3 Doctor Profile and Verification
- 3.3.1 Set up professional profile
  - How: Doctor profile page → specialty, hospital, years of experience, languages
  - Visible to patients in the doctor portal

- 3.3.2 Get verified badge
  - How: Submit NMC registration number + state council + certificate (optional)
  - Manual verification against nmc.org.in within 24-48 hours
  - Verified badge appears next to name for patients

---

### 4. PLATFORM-LEVEL FEATURES

#### 4.1 Security
- All API routes require authentication (Clerk JWT)
- Every resource verifies ownership before access (no cross-user data leakage)
- File uploads: 10MB limit, PDF/JPG/PNG only
- Input validation on all health fields (numeric bounds, format checks)
- Rate limiting on all AI endpoints

#### 4.2 Privacy
- Documents stored on Cloudflare R2 (encrypted at rest)
- Health data in Neon PostgreSQL (encrypted)
- Share links are token-based with optional expiry
- Caregiver access is token-based and revocable
- Account deletion removes all data with one click

#### 4.3 India-Specific
- Indian English voice recognition (en-IN)
- Understands Indian food: chai, daal, roti, nimbu pani
- Indian prescription formats (handwritten, Hindi/English mix)
- ABHA (Ayushman Bharat) health ID integration
- HFR (Health Facility Registry) specialist finder
- All alert thresholds calibrated for Indian population

---

## Coming Soon

- [ ] Apple Watch / Fitbit live sync
- [ ] WhatsApp alerts (via WhatsApp Business API)
- [ ] Hospital HL7/FHIR integration
- [ ] ABHA live health record sync (requires government HIP registration)
- [ ] Voice calls for elderly (AI calls to remind medication)
- [ ] Prescription delivery integration (1mg/PharmEasy)
- [ ] Insurance claim support
