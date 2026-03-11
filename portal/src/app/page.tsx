import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
        Client Portal
      </h1>
      <p style={{ opacity: 0.9, marginBottom: 24 }}>
        Sign in to view your devices, claim a device by serial number, and raise
        replacement requests.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <Link
          href="/login"
          style={{
            background: "#2b62ff",
            padding: "10px 14px",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          Login
        </Link>
        <Link
          href="/devices"
          style={{
            background: "rgba(255,255,255,0.08)",
            padding: "10px 14px",
            borderRadius: 10,
            textDecoration: "none",
            fontWeight: 600
          }}
        >
          My Devices
        </Link>
      </div>
    </main>
  );
}

