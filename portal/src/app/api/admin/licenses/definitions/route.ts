import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await requireAdminSession().catch(() => null);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const vendors = await db.licenseVendor.findMany({
    orderBy: { name: "asc" },
    include: {
      licenses: {
        orderBy: { name: "asc" }
      }
    }
  });

  return NextResponse.json({ vendors });
}

