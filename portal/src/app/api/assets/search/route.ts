import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await requireSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const serial = searchParams.get("serial") ?? "";
  const parsed = z.string().min(3).safeParse(serial.trim());
  if (!parsed.success) {
    return NextResponse.json({ results: [] });
  }

  const results = await db.haloAsset.findMany({
    where: {
      clientId: session.clientId,
      serialNumber: { contains: parsed.data, mode: "insensitive" },
      assignment: { is: null }
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
    select: {
      id: true,
      name: true,
      serialNumber: true,
      assetType: true
    }
  });

  return NextResponse.json({ results });
}

