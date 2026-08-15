import { db } from "@/db";
import { caregiverAccess, healthLogs, healthAlerts, familyContacts, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { today } from "@/lib/utils";
import { checkThresholds, sendAlertEmails } from "@/lib/alerts";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [access] = await db
    .select()
    .from(caregiverAccess)
    .where(eq(caregiverAccess.token, token))
    .limit(1);

  if (!access || !access.canLogHealth) {
    return Response.json({ error: "Invalid or unauthorized token" }, { status: 401 });
  }

  const patientUserId = access.patientUserId;
  const body = await request.json();
  const date = body.date || today();

  const [log] = await db
    .insert(healthLogs)
    .values({
      userId: patientUserId,
      date,
      mood: body.mood,
      energy: body.energy,
      sleep: body.sleep,
      water: body.water,
      exercise: body.exercise,
      steps: body.steps,
      weight: body.weight,
      heartRate: body.heartRate,
      systolic: body.systolic,
      diastolic: body.diastolic,
      bloodSugar: body.bloodSugar,
      temperature: body.temperature,
      oxygenSaturation: body.oxygenSaturation,
      calories: body.calories,
      symptoms: body.symptoms,
      notes: body.notes,
      painLevel: body.painLevel,
    })
    .returning();

  const alerts = checkThresholds(body);

  if (alerts.length > 0) {
    await db.insert(healthAlerts).values(
      alerts.map((a) => ({
        userId: patientUserId,
        logId: log.id,
        type: a.type,
        severity: a.severity,
        message: a.message,
        value: a.value,
      }))
    );

    const contacts = await db
      .select()
      .from(familyContacts)
      .where(
        and(
          eq(familyContacts.userId, patientUserId),
          eq(familyContacts.alertsEnabled, true)
        )
      );

    if (contacts.length > 0) {
      const [patientRow] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, patientUserId))
        .limit(1);

      const name = patientRow?.name || "Your family member";
      const email = patientRow?.email || "";

      sendAlertEmails(name, email, contacts, alerts).catch((err: Error) => {
        console.error("[caregiver-alerts] Failed to send alert emails:", err?.message ?? err);
      });
    }
  }

  return Response.json({ ...log, alerts }, { status: 201 });
}
