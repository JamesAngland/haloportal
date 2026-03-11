import { db } from "@/lib/db";
import { normalizeOs } from "@/lib/os/normalize";

export type OsEolInfo =
  | { status: "unknown" }
  | { status: "supported"; eolDate: Date }
  | { status: "near_eol"; eolDate: Date }
  | { status: "eol"; eolDate: Date };

export async function getOsEolInfo(osNameRaw: string | null | undefined): Promise<OsEolInfo> {
  const normalized = normalizeOs(osNameRaw);
  if (!normalized) return { status: "unknown" };

  const row = await db.osLifecycle.findFirst({
    where: {
      vendor: normalized.vendor,
      family: normalized.family,
      version: normalized.version
    }
  });

  if (!row) return { status: "unknown" };

  const now = new Date();
  const eol = row.eolDate;
  if (now >= eol) return { status: "eol", eolDate: eol };

  const nearEolThreshold = new Date(eol.getTime());
  nearEolThreshold.setDate(nearEolThreshold.getDate() - 180);
  if (now >= nearEolThreshold) return { status: "near_eol", eolDate: eol };

  return { status: "supported", eolDate: eol };
}

