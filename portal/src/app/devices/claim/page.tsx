"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type SearchResult = {
  id: string;
  name: string | null;
  serialNumber: string | null;
  assetType: string | null;
};

export default function ClaimDevicePage() {
  const [serial, setSerial] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSearch = useMemo(() => serial.trim().length >= 3, [serial]);

  async function search() {
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/search?serial=${encodeURIComponent(serial.trim())}`);
      if (!res.ok) throw new Error("Search failed");
      const data = (await res.json()) as { results: SearchResult[] };
      setResults(data.results);
      if (data.results.length === 0) setMessage("No unassigned devices found.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function claim(assetId: string) {
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/me/assets/claim`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assetId })
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok) throw new Error(data?.error ?? "Claim failed");
      setMessage("Device added to your profile.");
      setResults((r) => r.filter((x) => x.id !== assetId));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            Add a device
          </h1>
          <p style={{ opacity: 0.85, margin: 0 }}>
            Search company devices by serial number and add it to your profile
            if it’s not assigned to another user.
          </p>
        </div>
        <Link href="/devices" style={{ opacity: 0.9 }}>
          ← Back to My Devices
        </Link>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          gap: 10,
          alignItems: "center"
        }}
      >
        <input
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="Enter serial number (min 3 chars)"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.25)",
            color: "white"
          }}
        />
        <button
          disabled={!canSearch || loading}
          onClick={search}
          style={{
            background: !canSearch || loading ? "rgba(43,98,255,0.55)" : "#2b62ff",
            padding: "10px 14px",
            borderRadius: 10,
            border: 0,
            color: "white",
            fontWeight: 800,
            cursor: !canSearch || loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Working..." : "Search"}
        </button>
      </div>

      {message ? (
        <div style={{ marginTop: 12, opacity: 0.9 }}>{message}</div>
      ) : null}

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        {results.map((r) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: 12
            }}
          >
            <div style={{ display: "grid" }}>
              <span style={{ fontWeight: 800 }}>{r.name ?? "Unnamed device"}</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                {r.assetType ?? "Device"} · Serial: {r.serialNumber ?? "—"}
              </span>
            </div>
            <button
              disabled={loading}
              onClick={() => claim(r.id)}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "8px 10px",
                borderRadius: 10,
                color: "white",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              Add to my profile
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

