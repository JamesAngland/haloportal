import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const assignments = await db.licenseAssignment.findMany({
    where: {
      user: {
        clientId: session.clientId
      }
    },
    select: {
      userId: true,
      licenseId: true
    }
  });

  return NextResponse.json({ assignments });
}

