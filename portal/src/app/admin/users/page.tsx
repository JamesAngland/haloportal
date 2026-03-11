"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin" | "manager";
  createdAt: string;
};

type LicenseVendor = {
  id: string;
  name: string;
  label: string;
  licenses: { id: string; name: string; code: string }[];
};

type LicenseAssignment = {
  userId: string;
  licenseId: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"users" | "licenses">("users");

  const [vendors, setVendors] = useState<LicenseVendor[]>([]);
  const [assignments, setAssignments] = useState<LicenseAssignment[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [activeVendor, setActiveVendor] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin" | "manager">("user");
  const [newPassword, setNewPassword] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users/list");
      const data = (await res.json()) as { users?: User[]; error?: string };
      if (!res.ok || !data.users) throw new Error(data.error ?? "Failed to load users");
      setUsers(
        data.users.map((u) => ({
          ...u,
          createdAt: typeof u.createdAt === "string" ? u.createdAt : String(u.createdAt)
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function loadLicenses() {
    setLicensesLoading(true);
    setError(null);
    try {
      const [defsRes, asgRes] = await Promise.all([
        fetch("/api/admin/licenses/definitions"),
        fetch("/api/admin/licenses/assignments")
      ]);
      const defsData = (await defsRes.json()) as {
        vendors?: LicenseVendor[];
        error?: string;
      };
      const asgData = (await asgRes.json()) as {
        assignments?: LicenseAssignment[];
        error?: string;
      };
      if (!defsRes.ok || !defsData.vendors) {
        throw new Error(defsData.error ?? "Failed to load license definitions");
      }
      if (!asgRes.ok || !asgData.assignments) {
        throw new Error(asgData.error ?? "Failed to load license assignments");
      }
      setVendors(defsData.vendors);
      setAssignments(asgData.assignments);
      if (!activeVendor && defsData.vendors.length > 0) {
        setActiveVendor(defsData.vendors[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load licenses");
    } finally {
      setLicensesLoading(false);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          name: newName || undefined,
          role: newRole,
          password: newPassword
        })
      });
      const data = (await res.json()) as { user?: User; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error ?? "Failed to create user");
      setUsers((prev) => [...prev, data.user!]);
      setNewEmail("");
      setNewName("");
      setNewPassword("");
      setNewRole("user");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  }

  async function updateRole(userId: string, role: "user" | "admin" | "manager") {
    setError(null);
    try {
      const res = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, role })
      });
      const data = (await res.json()) as { user?: User; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error ?? "Failed to update role");
      setUsers((prev) => prev.map((u) => (u.id === userId ? data.user! : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Remove this user?")) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to delete user");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  return (
    <main>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            User management
          </h1>
          <p style={{ opacity: 0.85, margin: 0 }}>
            Manage users for this client and set permission levels.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setView("users")}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: 0,
              cursor: "pointer",
              background: view === "users" ? "#2b62ff" : "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 600,
              fontSize: 13
            }}
          >
            Users
          </button>
          <button
            onClick={() => {
              setView("licenses");
              if (vendors.length === 0) void loadLicenses();
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: 0,
              cursor: "pointer",
              background: view === "licenses" ? "#2b62ff" : "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 600,
              fontSize: 13
            }}
          >
            Licenses matrix
          </button>
          <Link href="/devices" style={{ opacity: 0.9 }}>
            ← Back to portal
          </Link>
        </div>
      </div>

      {view === "users" && (
        <>
          <section
        style={{
          marginBottom: 20,
          padding: 16,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)"
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Add user</h2>
        <form
          onSubmit={createUser}
          style={{ display: "grid", gap: 10, gridTemplateColumns: "2fr 1.3fr 1fr 1.5fr auto" }}
        >
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email"
            required
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              color: "white"
            }}
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (optional)"
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              color: "white"
            }}
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as typeof newRole)}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              color: "white"
            }}
          >
            <option value="user">user</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Initial password"
            minLength={8}
            required
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              color: "white"
            }}
          />
          <button
            style={{
              background: "#2b62ff",
              borderRadius: 10,
              border: 0,
              padding: "8px 12px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Add
          </button>
        </form>
          </section>

          {error ? (
            <div
              style={{
                marginBottom: 12,
                background: "rgba(255,68,68,0.12)",
                border: "1px solid rgba(255,68,68,0.2)",
                padding: "8px 10px",
                borderRadius: 10
              }}
            >
              {error}
            </div>
          ) : null}

          <section
            style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 140px",
                padding: "8px 12px",
                background: "rgba(255,255,255,0.04)",
                fontSize: 13,
                opacity: 0.9
              }}
            >
              <div>Email</div>
              <div>Name</div>
              <div>Role</div>
              <div>Actions</div>
            </div>
            {loading ? (
              <div style={{ padding: 12 }}>Loading…</div>
            ) : users.length === 0 ? (
              <div style={{ padding: 12, opacity: 0.9 }}>
                No users for this client yet.
              </div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 140px",
                    padding: "10px 12px",
                    borderTop: "1px solid rgba(255,255,255,0.06)"
                  }}
                >
                  <div>{u.email}</div>
                  <div>{u.name ?? "—"}</div>
                  <div>
                    <select
                      value={u.role}
                      onChange={(e) =>
                        updateRole(u.id, e.target.value as "user" | "admin" | "manager")
                      }
                      style={{
                        padding: "4px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(0,0,0,0.25)",
                        color: "white",
                        fontSize: 12
                      }}
                    >
                      <option value="user">user</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div>
                    <button
                      onClick={() => deleteUser(u.id)}
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        padding: "6px 10px",
                        borderRadius: 10,
                        color: "white",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      )}

      {view === "licenses" && (
        <section
          style={{
            marginTop: 8,
            padding: 16,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)"
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
            Licenses matrix
          </h2>
          {error ? (
            <div
              style={{
                marginBottom: 12,
                background: "rgba(255,68,68,0.12)",
                border: "1px solid rgba(255,68,68,0.2)",
                padding: "8px 10px",
                borderRadius: 10
              }}
            >
              {error}
            </div>
          ) : null}

          <div style={{ marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {vendors.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveVendor(v.name)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: 0,
                  cursor: "pointer",
                  background:
                    activeVendor === v.name ? "#2b62ff" : "rgba(255,255,255,0.08)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          {licensesLoading ? (
            <div>Loading licenses…</div>
          ) : !activeVendor || vendors.length === 0 ? (
            <div style={{ opacity: 0.9 }}>No license definitions configured yet.</div>
          ) : (
            (() => {
              const vendor = vendors.find((v) => v.name === activeVendor);
              if (!vendor) {
                return <div style={{ opacity: 0.9 }}>No licenses for this vendor.</div>;
              }
              if (vendor.licenses.length === 0) {
                return (
                  <div style={{ opacity: 0.9 }}>
                    No license SKUs defined for {vendor.label}.
                  </div>
                );
              }

              const hasAssignment = (userId: string, licId: string) =>
                assignments.some(
                  (a) => a.userId === userId && a.licenseId === licId
                );

              const toggleAssignment = async (userId: string, licId: string, next: boolean) => {
                try {
                  const url = next
                    ? "/api/admin/licenses/assign"
                    : "/api/admin/licenses/unassign";
                  const res = await fetch(url, {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ userId, licenseId: licId })
                  });
                  const data = (await res.json()) as { ok?: boolean; error?: string };
                  if (!res.ok || !data.ok) {
                    throw new Error(data.error ?? "Failed to update license");
                  }
                  setAssignments((prev) =>
                    next
                      ? [...prev, { userId, licenseId: licId }]
                      : prev.filter(
                          (a) => !(a.userId === userId && a.licenseId === licId)
                        )
                  );
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Failed to update license"
                  );
                }
              };

              return (
                <div
                  style={{
                    overflowX: "auto",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 600
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          fontSize: 13
                        }}
                      >
                        <th
                          style={{
                            textAlign: "left",
                            padding: "8px 10px",
                            borderBottom: "1px solid rgba(255,255,255,0.1)"
                          }}
                        >
                          User
                        </th>
                        {vendor.licenses.map((lic) => (
                          <th
                            key={lic.id}
                            style={{
                              textAlign: "center",
                              padding: "8px 10px",
                              borderBottom: "1px solid rgba(255,255,255,0.1)"
                            }}
                          >
                            <div>{lic.name}</div>
                            <div style={{ fontSize: 11, opacity: 0.7 }}>{lic.code}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td
                            colSpan={1 + vendor.licenses.length}
                            style={{ padding: "10px 12px", opacity: 0.9 }}
                          >
                            No users for this client yet.
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id}>
                            <td
                              style={{
                                padding: "8px 10px",
                                borderTop: "1px solid rgba(255,255,255,0.06)"
                              }}
                            >
                              <div>{u.email}</div>
                              <div style={{ fontSize: 11, opacity: 0.7 }}>
                                {u.name ?? "—"}
                              </div>
                            </td>
                            {vendor.licenses.map((lic) => {
                              const checked = hasAssignment(u.id, lic.id);
                              return (
                                <td
                                  key={lic.id}
                                  style={{
                                    textAlign: "center",
                                    padding: "8px 10px",
                                    borderTop: "1px solid rgba(255,255,255,0.06)"
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) =>
                                      void toggleAssignment(u.id, lic.id, e.target.checked)
                                    }
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })()
          )}
        </section>
      )}
    </main>
  );
}

