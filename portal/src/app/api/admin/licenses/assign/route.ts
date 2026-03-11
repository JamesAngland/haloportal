import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

const schema = z.object({
  userId: z.string().min(1),
  licenseId: z.string().min(1)
});

export async function POST(req: Request) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const user = await db.portalUser.findFirst({
    where: { id: parsed.data.userId, clientId: session.clientId }
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const license = await db.licenseDefinition.findUnique({
    where: { id: parsed.data.licenseId }
  });
  if (!license) return NextResponse.json({ error: "License not found" }, { status: 404 });

  await db.licenseAssignment.upsert({
    where: {
      userId_licenseId: {
        userId: user.id,
        licenseId: license.id
      }
    },
    update: {},
    create: {
      userId: user.id,
      licenseId: license.id
    }
  });

  return NextResponse.json({ ok: true });
}

