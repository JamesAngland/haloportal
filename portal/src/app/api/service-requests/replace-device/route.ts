import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

// This is a stub that demonstrates wiring the button to a "service request".
// Replace the body of this route with a HaloPSA "create service request" call.
const schema = z.union([
  z.object({ assetId: z.string().min(1) }),
  z.object({ assetId: z.string().min(1) }).passthrough()
]);

export async function POST(req: Request) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const contentType = req.headers.get("content-type") ?? "";
  let assetId: string | null = null;

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (parsed.success) assetId = parsed.data.assetId;
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    const v = form.get("assetId");
    if (typeof v === "string") assetId = v;
  }

  if (!assetId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const assignment = await db.assetAssignment.findFirst({
    where: { portalUserId: session.sub, assetId },
    include: { asset: true }
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TODO: Create Halo service request here.
  // For now, return a deterministic placeholder so the UI wiring is real.
  const fakeTicketId = `SR-${assignment.asset.haloAssetId}`;

  return NextResponse.json({
    ok: true,
    ticketId: fakeTicketId,
    message: "Replacement request queued (stub)."
  });
}

