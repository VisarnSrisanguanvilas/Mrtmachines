"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API } from "@/lib/api";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr("");
    const res = await API.adminLogin(email, password);
    setLoading(false);
    if (res.access_token) {
      localStorage.setItem("mrt_admin_token", res.access_token);
      router.push("/admin/dashboard");
    } else {
      setErr(res.error || "เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="mrt-header" style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "1.5rem" }}>←</Link>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>⚙️ ระบบ Admin</div>
          <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>MRT Station Management</div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: "4rem", marginBottom: 8 }}>🚇</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>MRT Admin Portal</h1>
            <p style={{ color: "var(--mrt-text-muted)", marginTop: 4 }}>ระบบจัดการสถานีและเครื่องจำหน่ายตั๋ว</p>
          </div>

          <div className="glass" style={{ padding: 28 }}>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--mrt-text-muted)", marginBottom: 6 }}>
                  📧 Email
                </label>
                <input
                  id="admin-email"
                  className="mrt-input"
                  type="email"
                  placeholder="admin@mrt.co.th"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--mrt-text-muted)", marginBottom: 6 }}>
                  🔒 Password
                </label>
                <input
                  id="admin-password"
                  className="mrt-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {err && (
                <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#fca5a5", fontSize: "0.9rem" }}>
                  ⚠️ {err}
                </div>
              )}

              <button
                id="admin-login-btn"
                type="submit"
                className="btn-primary"
                style={{ width: "100%", padding: "14px" }}
                disabled={loading}
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
