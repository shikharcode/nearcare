import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  users,
  healthLogs,
  medications,
  medicationLogs,
  documents,
  healthAlerts,
  familyContacts,
  shareLinks,
  doctorPatients,
  doctorNotes,
  doctorProfiles,
} from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { deleteFile } from "@/lib/r2";

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

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body required" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    (body as Record<string, unknown>).confirm !== "DELETE"
  ) {
    return Response.json(
      { error: 'Confirmation required: send { "confirm": "DELETE" }' },
      { status: 400 }
    );
  }

  // Collect document R2 keys before deleting rows
  const userDocs = await db
    .select({ fileKey: documents.fileKey })
    .from(documents)
    .where(eq(documents.userId, userId));

  // Delete all user data in dependency order
  await db.delete(medicationLogs).where(eq(medicationLogs.userId, userId));
  await db.delete(medications).where(eq(medications.userId, userId));
  await db.delete(healthAlerts).where(eq(healthAlerts.userId, userId));
  await db.delete(healthLogs).where(eq(healthLogs.userId, userId));
  await db.delete(documents).where(eq(documents.userId, userId));
  await db.delete(familyContacts).where(eq(familyContacts.userId, userId));
  await db.delete(shareLinks).where(eq(shareLinks.userId, userId));
  await db.delete(doctorNotes).where(
    or(
      eq(doctorNotes.doctorUserId, userId),
      eq(doctorNotes.patientUserId, userId)
    )
  );
  await db.delete(doctorPatients).where(
    or(
      eq(doctorPatients.doctorUserId, userId),
      eq(doctorPatients.patientUserId, userId)
    )
  );
  await db.delete(doctorProfiles).where(eq(doctorProfiles.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  // Delete R2 files (best-effort, don't fail the request if individual deletes error)
  await Promise.allSettled(userDocs.map((doc) => deleteFile(doc.fileKey)));

  return Response.json({ success: true });
}
