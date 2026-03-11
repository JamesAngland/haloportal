"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Unable to change password");
      }
      setMessage("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password");
    } finally {
      setLoading(false);
    }
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>My account</h1>

      <section
        style={{
          marginBottom: 20,
          padding: 16,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)"
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
          Change password
        </h2>
        <form
          onSubmit={onChangePassword}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.85 }}>Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "white"
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.85 }}>New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "white"
              }}
            />
          </label>
          {error ? (
            <div
              style={{
                background: "rgba(255,68,68,0.12)",
                border: "1px solid rgba(255,68,68,0.2)",
                padding: "8px 10px",
                borderRadius: 10
              }}
            >
              {error}
            </div>
          ) : null}
          {message ? (
            <div
              style={{
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.35)",
                padding: "8px 10px",
                borderRadius: 10
              }}
            >
              {message}
            </div>
          ) : null}
          <button
            disabled={loading}
            style={{
              marginTop: 4,
              background: loading ? "rgba(43,98,255,0.6)" : "#2b62ff",
              padding: "10px 14px",
              borderRadius: 10,
              border: 0,
              color: "white",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Saving..." : "Change password"}
          </button>
        </form>
      </section>

      <section
        style={{
          padding: 16,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)"
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Session</h2>
        <button
          onClick={onLogout}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "10px 14px",
            borderRadius: 10,
            color: "white",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          Log out
        </button>
      </section>
    </main>
  );
}

