import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSessionCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  let user = await db.portalUser.findFirst({
    where: { email },
    include: { client: true }
  });

  // Optional: allow first-time signups without seed when ALLOW_AUTO_SIGNUP=true
  if (!user && process.env.ALLOW_AUTO_SIGNUP === "true") {
    const client =
      (await db.client.findFirst()) ??
      (await db.client.create({
        data: { name: "Example Co" }
      }));

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    user = await db.portalUser.create({
      data: {
        clientId: client.id,
        email,
        name: email.split("@")[0],
        role: "user",
        passwordHash
      },
      include: { client: true }
    });
  }

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSessionCookie({
    sub: user.id,
    clientId: user.clientId,
    email: user.email,
    role: user.role
  });

  return NextResponse.json({ ok: true });
}

