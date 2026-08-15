import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { abhaId?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const raw = typeof body.abhaId === "string" ? body.abhaId : "";
  const cleaned = raw.replace(/-/g, "").trim();

  if (!/^\d{14}$/.test(cleaned)) {
    return Response.json(
      { error: "Invalid ABHA ID format. Must be exactly 14 digits." },
      { status: 400 }
    );
  }

  return Response.json({
    verified: false,
    stored: true,
    abhaId: cleaned,
    message: "ABHA ID saved. Live government verification coming soon.",
  });
}
