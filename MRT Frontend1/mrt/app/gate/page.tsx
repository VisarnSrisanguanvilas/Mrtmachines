"use client";
import { useEffect, useState } from "react";
import { API, Station } from "@/lib/api";
import Link from "next/link";

type GateResult = {
  success: boolean;
  message: string;
  detail?: string;
};

function GateDisplay({ result, mode }: { result: GateResult | null; mode: "in" | "out" }) {
  if (!result)
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 160, height: 160, margin: "0 auto 16px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          border: "3px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "5rem",
        }}>
          {mode === "in" ? "🚶" : "🚶‍♀️"}
        </div>
        <p style={{ color: "var(--mrt-text-muted)" }}>รอการแตะบัตร / ตั๋ว</p>
      </div>
    );

  const ok = result.success;
  return (
    <div style={{ textAlign: "center", animation: "fadeIn 0.4s ease" }}>
      <div style={{
        width: 160, height: 160, margin: "0 auto 16px",
        borderRadius: "50%",
        background: ok ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)",
        border: `3px solid ${ok ? "#16a34a" : "#dc2626"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "5rem",
        animation: ok ? "gatePulse 1s ease 2" : "none",
      }}>
        {ok ? "✅" : "❌"}
      </div>
      <div style={{
        fontSize: "1.2rem", fontWeight: 800,
        color: ok ? "#86efac" : "#fca5a5",
        marginBottom: 8,
      }}>
        {ok ? "ประตูเปิด" : "ประตูปิด"}
      </div>
      <p style={{ color: "var(--mrt-text-muted)", fontSize: "0.9rem" }}>
        {result.message || result.detail}
      </p>
    </div>
  );
}

export default function GatePage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [mode, setMode] = useState<"in" | "out">("in");
  const [ticketId, setTicketId] = useState("");
  const [stationId, setStationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GateResult | null>(null);

  useEffect(() => {
    API.getStations().then(d => { if (Array.isArray(d)) setStations(d); });
  }, []);

  const blue = stations.filter(s => s.line === "blue");
  const purple = stations.filter(s => s.line === "purple");

  const handleGate = async () => {
    if (!ticketId || !stationId) return;
    setLoading(true); setResult(null);
    try {
      const res = mode === "in"
        ? await API.checkIn(Number(ticketId), stationId)
        : await API.checkOut(Number(ticketId), stationId);

      if (res.message) {
        setResult({ success: true, message: res.message });
      } else {
        setResult({ success: false, message: res.detail || JSON.stringify(res) });
      }
    } catch {
      setResult({ success: false, message: "เชื่อมต่อ Backend ไม่ได้" });
    }
    setLoading(false);
  };

  const reset = () => { setResult(null); setTicketId(""); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="mrt-header" style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "1.5rem" }}>←</Link>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>🚪 ระบบประตู Gate</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>MRT Fare Gate System</div>
          </div>
        </div>
        <Link href="/admin">
          <button className="btn-outline" style={{ fontSize: "0.8rem", padding: "7px 12px" }}>⚙️ Admin</button>
        </Link>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          {/* Mode selector */}
          <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", border: "1px solid var(--mrt-border)", marginBottom: 24 }}>
            {(["in", "out"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); reset(); }}
                style={{
                  flex: 1, padding: "12px 0", border: "none", cursor: "pointer",
                  background: mode === m ? "var(--mrt-blue-light)" : "var(--mrt-surface)",
                  color: mode === m ? "white" : "var(--mrt-text-muted)",
                  fontFamily: "'Noto Sans Thai', sans-serif",
                  fontWeight: mode === m ? 700 : 400,
                  fontSize: "1rem",
                  transition: "all 0.2s",
                }}
              >
                {m === "in" ? "🚶‍♂️ เข้าสถานี (Check-In)" : "🚶‍♀️ ออกสถานี (Check-Out)"}
              </button>
            ))}
          </div>

          {/* Gate display */}
          <div className="glass" style={{ padding: 32, marginBottom: 24 }}>
            <GateDisplay result={result} mode={mode} />
          </div>

          {/* Input form */}
          {!result ? (
            <div className="glass" style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--mrt-text-muted)", marginBottom: 6 }}>
                  🎫 Ticket ID
                </label>
                <input
                  className="mrt-input"
                  type="number"
                  placeholder="กรอก Ticket ID"
                  value={ticketId}
                  onChange={e => setTicketId(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleGate(); }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--mrt-text-muted)", marginBottom: 6 }}>
                  📍 สถานีที่ประตูนี้ตั้งอยู่
                </label>
                <select
                  className="mrt-input"
                  value={stationId ?? ""}
                  onChange={e => setStationId(Number(e.target.value))}
                >
                  <option value="">-- เลือกสถานี --</option>
                  <optgroup label="สาย Blue">
                    {blue.map(s => <option key={s.id} value={s.id}>{s.code} {s.name}</option>)}
                  </optgroup>
                  <optgroup label="สาย Purple">
                    {purple.map(s => <option key={s.id} value={s.id}>{s.code} {s.name}</option>)}
                  </optgroup>
                </select>
              </div>

              <button
                className={mode === "in" ? "btn-primary" : "btn-success"}
                style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                disabled={!ticketId || !stationId || loading}
                onClick={handleGate}
                id="gate-submit-btn"
              >
                {loading ? "กำลังตรวจสอบ..." : (mode === "in" ? "🚶‍♂️ แตะเข้า (Check-In)" : "🚶‍♀️ แตะออก (Check-Out)")}
              </button>
            </div>
          ) : (
            <button className="btn-outline" style={{ width: "100%", padding: "12px" }} onClick={reset}>
              ← แตะบัตรใหม่
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
