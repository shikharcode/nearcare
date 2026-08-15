export const meta = {
  name: "carebridge-family-alerts",
  description: "Build CareBridge family alert system, health threshold alerts, caregiver dashboard, PWA support, and profile page",
  phases: [
    { title: "Schema & API", detail: "DB schema additions, alert API routes, email service" },
    { title: "UI", detail: "Family contacts UI, alert banners, caregiver dashboard, profile page, PWA" },
    { title: "Verify", detail: "TypeScript check and integration review" },
  ],
};

// ─── PHASE 1: Schema + APIs + Email ───────────────────────────────────────────
phase("Schema & API");

const schemaResult = await agent(`
You are building the CareBridge health app at /Users/singhs1/myprod/carebridge.
The project uses Next.js 16 App Router, Drizzle ORM, Neon Postgres, Resend for email, TypeScript.

TASK: Update the database schema and push it, then write all backend API routes.

## Step 1 — Update /Users/singhs1/myprod/carebridge/src/db/schema.ts
Add these two new tables at the END of the file (after shareLinks):

\`\`\`typescript
export const familyContacts = pgTable("family_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  relationship: text("relationship"), // son, daughter, spouse, caregiver, doctor
  alertsEnabled: boolean("alerts_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const healthAlerts = pgTable("health_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  logId: uuid("log_id"),
  type: text("type").notNull(), // blood_pressure, heart_rate, blood_sugar, temperature, spo2, pain
  severity: text("severity").notNull(), // warning, critical
  message: text("message").notNull(),
  value: text("value"),
  emailSent: boolean("email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
\`\`\`

## Step 2 — Push schema to DB
Run: cd /Users/singhs1/myprod/carebridge && npm run db:push

## Step 3 — Create /Users/singhs1/myprod/carebridge/src/lib/alerts.ts
This file contains the threshold checking logic and email sending:

\`\`\`typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface AlertResult {
  type: string;
  severity: "warning" | "critical";
  message: string;
  value: string;
}

export function checkThresholds(log: Record<string, any>): AlertResult[] {
  const alerts: AlertResult[] = [];

  if (log.systolic && log.diastolic) {
    if (log.systolic > 180 || log.diastolic > 120)
      alerts.push({ type: "blood_pressure", severity: "critical", message: "Blood pressure is critically high — seek immediate medical attention", value: log.systolic + "/" + log.diastolic + " mmHg" });
    else if (log.systolic > 140 || log.diastolic > 90)
      alerts.push({ type: "blood_pressure", severity: "warning", message: "Blood pressure is above normal range", value: log.systolic + "/" + log.diastolic + " mmHg" });
    else if (log.systolic < 90 || log.diastolic < 60)
      alerts.push({ type: "blood_pressure", severity: "warning", message: "Blood pressure is below normal range", value: log.systolic + "/" + log.diastolic + " mmHg" });
  }

  if (log.heartRate) {
    if (log.heartRate > 120)
      alerts.push({ type: "heart_rate", severity: "warning", message: "Heart rate is elevated", value: log.heartRate + " bpm" });
    else if (log.heartRate < 50)
      alerts.push({ type: "heart_rate", severity: "warning", message: "Heart rate is lower than normal", value: log.heartRate + " bpm" });
  }

  if (log.bloodSugar) {
    if (log.bloodSugar < 70)
      alerts.push({ type: "blood_sugar", severity: "critical", message: "Blood sugar is dangerously low — take action immediately", value: log.bloodSugar + " mg/dL" });
    else if (log.bloodSugar > 250)
      alerts.push({ type: "blood_sugar", severity: "critical", message: "Blood sugar is critically high", value: log.bloodSugar + " mg/dL" });
    else if (log.bloodSugar > 180)
      alerts.push({ type: "blood_sugar", severity: "warning", message: "Blood sugar is above normal range", value: log.bloodSugar + " mg/dL" });
  }

  if (log.temperature) {
    if (log.temperature > 39.5)
      alerts.push({ type: "temperature", severity: "critical", message: "Very high fever detected", value: log.temperature + "°C" });
    else if (log.temperature > 38)
      alerts.push({ type: "temperature", severity: "warning", message: "Fever detected", value: log.temperature + "°C" });
  }

  if (log.oxygenSaturation) {
    if (log.oxygenSaturation < 90)
      alerts.push({ type: "spo2", severity: "critical", message: "Oxygen saturation is critically low — seek immediate help", value: log.oxygenSaturation + "%" });
    else if (log.oxygenSaturation < 95)
      alerts.push({ type: "spo2", severity: "warning", message: "Oxygen saturation is below normal", value: log.oxygenSaturation + "%" });
  }

  if (log.painLevel && log.painLevel >= 8)
    alerts.push({ type: "pain", severity: "warning", message: "Severe pain reported", value: log.painLevel + "/10" });

  return alerts;
}

export async function sendAlertEmails(
  userName: string,
  userEmail: string,
  contacts: Array<{ name: string; email: string; relationship?: string | null }>,
  alerts: AlertResult[]
) {
  if (!contacts.length || !alerts.length) return;

  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  const warningAlerts = alerts.filter(a => a.severity === "warning");

  const alertHtml = alerts.map(a => \`
    <div style="padding:12px;margin:8px 0;border-radius:8px;background:\${a.severity === "critical" ? "#fef2f2" : "#fffbeb"};border-left:4px solid \${a.severity === "critical" ? "#ef4444" : "#f59e0b"}">
      <p style="margin:0;font-weight:600;color:\${a.severity === "critical" ? "#dc2626" : "#d97706"}">\${a.severity === "critical" ? "🔴 CRITICAL" : "⚠️ Warning"}: \${a.type.replace("_", " ").toUpperCase()}</p>
      <p style="margin:4px 0 0;color:#374151">\${a.message}</p>
      <p style="margin:4px 0 0;color:#6b7280;font-size:14px">Value: <strong>\${a.value}</strong></p>
    </div>
  \`).join("");

  for (const contact of contacts) {
    await resend.emails.send({
      from: "CareBridge Alerts <alerts@carebridge.health>",
      to: contact.email,
      subject: \`\${criticalAlerts.length > 0 ? "🔴 URGENT: " : "⚠️ "}Health Alert for \${userName}\`,
      html: \`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
            <span style="font-size:24px">❤️</span>
            <h1 style="margin:0;font-size:20px;color:#111827">CareBridge Health Alert</h1>
          </div>
          <p style="color:#374151">Hi \${contact.name},</p>
          <p style="color:#374151"><strong>\${userName}</strong> just logged their health vitals and \${alerts.length === 1 ? "a reading" : "some readings"} \${alerts.length === 1 ? "was" : "were"} outside the normal range.</p>
          \${alertHtml}
          <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:8px">
            <p style="margin:0;color:#6b7280;font-size:14px">This is an automated alert from CareBridge. Please check on \${userName} if needed.</p>
          </div>
        </div>
      \`,
    }).catch(() => {}); // don't fail if email fails
  }
}
\`\`\`

## Step 4 — Create /Users/singhs1/myprod/carebridge/src/app/api/family-contacts/route.ts

\`\`\`typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { familyContacts, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const contacts = await db.select().from(familyContacts).where(eq(familyContacts.userId, userId));
  return Response.json(contacts);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  await db.insert(users).values({ id: userId, email: "" }).onConflictDoNothing();
  const [contact] = await db.insert(familyContacts).values({
    userId,
    name: body.name,
    email: body.email,
    phone: body.phone,
    relationship: body.relationship,
    alertsEnabled: true,
  }).returning();
  return Response.json(contact, { status: 201 });
}
\`\`\`

## Step 5 — Create /Users/singhs1/myprod/carebridge/src/app/api/family-contacts/[id]/route.ts

\`\`\`typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { familyContacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(familyContacts).where(and(eq(familyContacts.id, id), eq(familyContacts.userId, userId)));
  return Response.json({ success: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const [contact] = await db.update(familyContacts)
    .set({ alertsEnabled: body.alertsEnabled })
    .where(and(eq(familyContacts.id, id), eq(familyContacts.userId, userId)))
    .returning();
  return Response.json(contact);
}
\`\`\`

## Step 6 — Create /Users/singhs1/myprod/carebridge/src/app/api/alerts/route.ts

\`\`\`typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { healthAlerts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const alerts = await db.select().from(healthAlerts)
    .where(eq(healthAlerts.userId, userId))
    .orderBy(desc(healthAlerts.createdAt))
    .limit(20);
  return Response.json(alerts);
}
\`\`\`

## Step 7 — Update /Users/singhs1/myprod/carebridge/src/app/api/health-logs/route.ts
After inserting the health log, add alert checking. Replace the POST export with:

\`\`\`typescript
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const date = body.date || today();

  await db.insert(users).values({ id: userId, email: "" }).onConflictDoNothing();

  const [log] = await db.insert(healthLogs).values({
    userId, date,
    mood: body.mood, energy: body.energy, sleep: body.sleep, water: body.water,
    exercise: body.exercise, steps: body.steps, weight: body.weight,
    heartRate: body.heartRate, systolic: body.systolic, diastolic: body.diastolic,
    bloodSugar: body.bloodSugar, temperature: body.temperature,
    oxygenSaturation: body.oxygenSaturation, calories: body.calories,
    symptoms: body.symptoms, notes: body.notes, painLevel: body.painLevel,
  }).returning();

  // Check thresholds and send alerts
  const alertResults = checkThresholds(body);
  if (alertResults.length > 0) {
    // Save alerts to DB
    await db.insert(healthAlerts).values(
      alertResults.map(a => ({
        userId, logId: log.id,
        type: a.type, severity: a.severity, message: a.message, value: a.value,
      }))
    );

    // Get family contacts and user info
    const [contacts, userRows] = await Promise.all([
      db.select().from(familyContacts).where(eq(familyContacts.userId, userId)),
      db.select().from(users).where(eq(users.id, userId)),
    ]);

    const activeContacts = contacts.filter(c => c.alertsEnabled);
    const userName = userRows[0]?.name || "Your family member";
    const userEmail = userRows[0]?.email || "";

    if (activeContacts.length > 0) {
      await sendAlertEmails(userName, userEmail, activeContacts, alertResults);
      await db.update(healthAlerts).set({ emailSent: true }).where(eq(healthAlerts.userId, userId));
    }
  }

  return Response.json({ ...log, alerts: alertResults }, { status: 201 });
}
\`\`\`

Also add these imports at the top of the file:
\`\`\`typescript
import { healthAlerts, familyContacts } from "@/db/schema";
import { checkThresholds, sendAlertEmails } from "@/lib/alerts";
\`\`\`

After making all changes, run: cd /Users/singhs1/myprod/carebridge && npx tsc --noEmit 2>&1
Report any errors found.
`, { label: "Schema + APIs + Alerts" });

log("Schema and APIs done: " + (schemaResult?.slice?.(0, 100) ?? "ok"));

// ─── PHASE 2: UI ──────────────────────────────────────────────────────────────
phase("UI");

const [familyUI, profileUI, pwaResult] = await parallel([
  // Family Contacts Page
  () => agent(`
You are building the CareBridge health app at /Users/singhs1/myprod/carebridge.
Stack: Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui (uses @base-ui/react — DialogTrigger uses render={<Button />} NOT asChild).
Dark mode classes required on everything.

TASK: Create /Users/singhs1/myprod/carebridge/src/app/dashboard/family/page.tsx

This is a client component ('use client') for managing family contacts who receive health alerts.

The page should:
1. List all family contacts with name, email, relationship badge, alerts toggle
2. Add contact form in a Dialog (name, email, phone optional, relationship dropdown: son/daughter/spouse/caregiver/doctor/other)
3. Delete contact button (hover to reveal, red X)
4. Toggle alerts on/off per contact
5. Show an empty state with a heart icon when no contacts

Use these API endpoints:
- GET /api/family-contacts → returns array of contacts
- POST /api/family-contacts → { name, email, phone, relationship }
- DELETE /api/family-contacts/:id
- PATCH /api/family-contacts/:id → { alertsEnabled: boolean }

Type for contact:
\`\`\`
type Contact = { id: string; name: string; email: string; phone?: string; relationship?: string; alertsEnabled?: boolean }
\`\`\`

Relationship colors:
- son/daughter: blue
- spouse: pink  
- caregiver: green
- doctor: purple
- other: gray

Use Card, Button, Input, Label, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger from shadcn.
Import toast from "sonner".
Import { Users, Plus, X, Bell, BellOff, Heart } from "lucide-react".

Make it beautiful, clean medical style, full dark mode support.
Write the complete file content.
`, { label: "Family Contacts UI" }),

  // Profile Page
  () => agent(`
You are building the CareBridge health app at /Users/singhs1/myprod/carebridge.
Stack: Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui. Dark mode required.

TASK: Create /Users/singhs1/myprod/carebridge/src/app/dashboard/profile/page.tsx

This is a client component that lets users manage their profile.

Features:
1. Show Clerk user info (name, email, profile photo) at the top using useUser from @clerk/nextjs
2. Health profile form: blood type (dropdown: A+/A-/B+/B-/AB+/AB-/O+/O-), date of birth, allergies (text), emergency contact name + phone
3. Save to /api/profile (POST) with { bloodType, dateOfBirth, allergies, emergencyContact }
4. Load existing profile from /api/profile (GET)
5. Show alerts history section — fetch from /api/alerts, show last 10 alerts with severity badge (red=critical, yellow=warning), type, message, date

Also create /Users/singhs1/myprod/carebridge/src/app/api/profile/route.ts:
\`\`\`typescript
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return Response.json(user || {});
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const clerkUser = await currentUser();
  const body = await request.json();
  await db.insert(users).values({
    id: userId,
    email: clerkUser?.emailAddresses[0]?.emailAddress || "",
    name: clerkUser?.fullName || "",
    bloodType: body.bloodType,
    dateOfBirth: body.dateOfBirth,
    allergies: body.allergies,
    emergencyContact: body.emergencyContact,
  }).onConflictDoUpdate({
    target: users.id,
    set: {
      name: clerkUser?.fullName || "",
      bloodType: body.bloodType,
      dateOfBirth: body.dateOfBirth,
      allergies: body.allergies,
      emergencyContact: body.emergencyContact,
    }
  });
  return Response.json({ success: true });
}
\`\`\`

Make the profile page beautiful, clean medical style with sections. Use Card, Input, Label, Button, Badge, Avatar from shadcn. Import { useUser } from "@clerk/nextjs". Full dark mode.
Write complete file content for both files.
`, { label: "Profile + Alerts UI" }),

  // PWA + sidebar update
  () => agent(`
You are building the CareBridge health app at /Users/singhs1/myprod/carebridge.
Stack: Next.js 16 App Router, TypeScript.

TASK 1: Create /Users/singhs1/myprod/carebridge/public/manifest.json for PWA:
\`\`\`json
{
  "name": "CareBridge",
  "short_name": "CareBridge",
  "description": "Your Personal Health OS",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
\`\`\`

TASK 2: Add PWA meta tags to /Users/singhs1/myprod/carebridge/src/app/layout.tsx
Read the file first, then add to the metadata export:
\`\`\`typescript
export const metadata: Metadata = {
  title: "CareBridge — Your Personal Health OS",
  description: "Track your health, medications, and medical history in one place.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CareBridge",
  },
};
\`\`\`

TASK 3: Update /Users/singhs1/myprod/carebridge/src/components/shared/sidebar-nav.tsx
Read the file first. Add two new nav items to the links array:
- { href: "/dashboard/family", label: "Family", icon: Users }  — add after Share
- { href: "/dashboard/profile", label: "Profile", icon: UserCircle } — add after Family

Import Users and UserCircle from "lucide-react" (add to existing import).

Write all changes carefully after reading current file state.
`, { label: "PWA + Navigation" }),
]);

log("UI agents done");

// ─── PHASE 3: Verify ──────────────────────────────────────────────────────────
phase("Verify");

const verifyResult = await agent(`
You are verifying the CareBridge health app at /Users/singhs1/myprod/carebridge.

Run these commands in order and report results:
1. cd /Users/singhs1/myprod/carebridge && npx tsc --noEmit 2>&1
2. If there are errors, read the relevant files and fix them
3. Run tsc again to confirm clean

Report: what errors were found, what was fixed, final status.
`, { label: "TypeScript Verify + Fix" });

log("Verification: " + (verifyResult?.slice?.(0, 200) ?? "done"));

return {
  built: [
    "Family contacts system (add son/daughter/caregiver/doctor)",
    "Health threshold alerts (BP, heart rate, blood sugar, temp, SpO2, pain)",
    "Automatic email alerts to family via Resend",
    "Alert history in profile page",
    "Profile page with health info + blood type + allergies",
    "PWA manifest (installable on phone)",
    "Updated sidebar navigation",
  ],
  nextSteps: [
    "Add RESEND_API_KEY domain in Resend dashboard (sender domain)",
    "Run npm run dev and test family contacts + health log alert flow",
  ],
};
