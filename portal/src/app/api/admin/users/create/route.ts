import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["user", "admin", "manager"]).default("user"),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.portalUser.findFirst({
    where: { clientId: session.clientId, email }
  });
  if (existing) {
    return NextResponse.json({ error: "User with that email already exists" }, { status: 409 });
  }

  const hash = await bcrypt.hash(parsed.data.password, 10);
  const user = await db.portalUser.create({
    data: {
      clientId: session.clientId,
      email,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash: hash
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });

  return NextResponse.json({ user });
}

