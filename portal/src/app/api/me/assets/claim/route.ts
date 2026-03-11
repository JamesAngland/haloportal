import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const schema = z.object({
  assetId: z.string().min(1)
});

export async function POST(req: Request) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const asset = await db.haloAsset.findFirst({
    where: { id: parsed.data.assetId, clientId: session.clientId }
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await db.assetAssignment.create({
      data: {
        assetId: asset.id,
        portalUserId: session.sub,
        source: "user_claim"
      }
    });
  } catch (err) {
    // The unique constraint on assetId enforces "only if not assigned to another user".
    if ((err as any)?.code === "P2002") {
      return NextResponse.json(
        { error: "That device is already assigned to another user." },
        { status: 409 }
      );
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}

