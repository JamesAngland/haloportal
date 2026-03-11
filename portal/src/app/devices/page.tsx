import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { getOsEolInfo } from "@/lib/os/eol";

function yearsOld(purchaseOrServiceDate: Date | null) {
  if (!purchaseOrServiceDate) return null;
  const now = new Date();
  const years = (now.getTime() - purchaseOrServiceDate.getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.floor(years);
}

export default async function MyDevicesPage() {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/login");

  const assignments = await db.assetAssignment.findMany({
    where: { portalUserId: session.sub },
    include: { asset: true },
    orderBy: { assignedAt: "desc" }
  });

  const rows = await Promise.all(
    assignments.map(async (a) => {
      const asset = a.asset;
      const date = asset.purchaseDate ?? asset.inServiceDate ?? null;
      const ageYears = yearsOld(date);
      const eol = await getOsEolInfo(asset.osName);
      const isOld = ageYears !== null && ageYears >= 5;
      const isEol = eol.status === "eol";
      const isRisk = isOld || isEol;
      return { asset, ageYears, eol, isOld, isEol, isRisk };
    })
  );

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>My Devices</h1>
          <p style={{ opacity: 0.85, margin: 0 }}>
            Devices you’ve claimed or that have been assigned to you.
          </p>
        </div>
        <Link
          href="/devices/claim"
          style={{
            background: "#2b62ff",
            padding: "10px 14px",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 700
          }}
        >
          Add device by serial
        </Link>
      </div>

      <div style={{ marginTop: 16, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 160px", padding: "10px 12px", background: "rgba(255,255,255,0.04)", fontSize: 13, opacity: 0.9 }}>
          <div>Device</div>
          <div>Serial</div>
          <div>Age</div>
          <div>OS</div>
          <div>Actions</div>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: 14, opacity: 0.85 }}>
            No devices yet. Use <Link href="/devices/claim">Add device by serial</Link>.
          </div>
        ) : (
          rows.map(({ asset, ageYears, eol, isRisk }) => (
            <div
              key={asset.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 160px",
                padding: "12px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                background: isRisk ? "rgba(255, 176, 0, 0.08)" : "transparent"
              }}
            >
              <div style={{ display: "grid" }}>
                <span style={{ fontWeight: 700 }}>{asset.name ?? "Unnamed device"}</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{asset.assetType ?? "Device"}</span>
              </div>
              <div style={{ opacity: 0.9 }}>{asset.serialNumber ?? "—"}</div>
              <div style={{ opacity: 0.9 }}>
                {ageYears === null ? "—" : `${ageYears}y`}
                {ageYears !== null && ageYears >= 5 ? (
                  <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.9, padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.16)" }}>
                    5y+
                  </span>
                ) : null}
              </div>
              <div style={{ opacity: 0.9 }}>
                {asset.osName ?? "—"}
                {eol.status === "eol" ? (
                  <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.9, padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(255,68,68,0.35)", background: "rgba(255,68,68,0.12)" }}>
                    EOL
                  </span>
                ) : eol.status === "near_eol" ? (
                  <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.9, padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(255,176,0,0.35)", background: "rgba(255,176,0,0.10)" }}>
                    Near EOL
                  </span>
                ) : null}
              </div>
              <div>
                <form action={`/api/service-requests/replace-device`} method="post">
                  <input type="hidden" name="assetId" value={asset.id} />
                  <button
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      padding: "8px 10px",
                      borderRadius: 10,
                      color: "white",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Replace device
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

