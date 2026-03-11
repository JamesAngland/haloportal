import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";

const sessionPayloadSchema = z.object({
  sub: z.string(),
  clientId: z.string(),
  email: z.string(),
  role: z.string()
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

const COOKIE_NAME = "portal_session";

function getJwtSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Missing SESSION_SECRET env var");
  return new TextEncoder().encode(secret);
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return sessionPayloadSchema.parse(payload);
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}

