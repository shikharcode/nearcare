import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, doctorProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [profile] = await db.select().from(doctorProfiles).where(eq(doctorProfiles.userId, userId));
  return Response.json(profile || {});
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const clerkUser = await currentUser();
  const body = await request.json();
  await db.insert(users).values({ id: userId, email: clerkUser?.emailAddresses[0]?.emailAddress || "", name: clerkUser?.fullName || "" }).onConflictDoNothing();
  const yearsOfExperience = body.yearsOfExperience !== "" && body.yearsOfExperience != null
    ? Number(body.yearsOfExperience)
    : null;
  const fields = {
    specialty: body.specialty,
    licenseNumber: body.licenseNumber,
    hospital: body.hospital,
    phone: body.phone,
    bio: body.bio,
    yearsOfExperience,
    languages: body.languages,
  };
  const [profile] = await db.insert(doctorProfiles).values({ userId, ...fields })
    .onConflictDoUpdate({ target: doctorProfiles.userId, set: fields })
    .returning();
  return Response.json(profile);
}
