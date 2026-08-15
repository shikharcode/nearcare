import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, doctorProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [profile] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.userId, userId));
  return Response.json(profile || null);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const clerkUser = await currentUser();
  const body = await request.json();
  await db.insert(users).values({ id: userId, email: clerkUser?.emailAddresses[0]?.emailAddress || "", name: clerkUser?.fullName || "" }).onConflictDoNothing();
  const [profile] = await db.insert(doctorProfiles).values({ userId, specialty: body.specialty, licenseNumber: body.licenseNumber, hospital: body.hospital, phone: body.phone, bio: body.bio })
    .onConflictDoUpdate({ target: doctorProfiles.userId, set: { specialty: body.specialty, licenseNumber: body.licenseNumber, hospital: body.hospital, phone: body.phone, bio: body.bio } })
    .returning();
  return Response.json(profile);
}
