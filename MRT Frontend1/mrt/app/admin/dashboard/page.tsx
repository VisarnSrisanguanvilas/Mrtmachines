"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API, Station } from "@/lib/api";
import Link from "next/link";

interface Machine {
  id: number;
  station_id: number;
  ticket_stock: number;
  cash_float_balance: number;
  cash_in_balance: number;
  is_active: boolean;
}

// Restock Modal
function RestockModal({ machineId, token, onClose, onDone }: { machineId: number; token: string; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async () => {
    setLoading(true);
    const res = await API.restockTickets(machineId, amount, token);
    setLoading(false);
    if (res.ticket_stock !== undefined) { setMsg(`✅ เติมสำเร็จ! Stock ใหม่: ${res.ticket_stock}`); onDone(); }
    else setMsg("❌ " + (res.detail || JSON.stringify(res)));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🎫 เติม Token / ตั๋ว (Machine #{machineId})</h3>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: "0.85rem", color: "var(--mrt-text-muted)", marginBottom: 6, display: "block" }}>จำนวนที่ต้องการเติม</label>
          <input id="restock-amount" className="mrt-input" type="number" min={1} value={amount} onChange={e => setAmount(Number(e.target.value))} />
        </div>
        {msg && <p style={{ marginBottom: 12, color: msg.startsWith("✅") ? "#86efac" : "#fca5a5", fontSize: "0.9rem" }}>{msg}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-danger" style={{ flex: 1 }} onClick={onClose}>ปิด</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={submit} disabled={loading}>{loading ? "กำลังเติม..." : "เติม Token"}</button>
        </div>
      </div>
    </div>
  );
}

// Add Cash Modal
function AddCashModal({ machineId, token, onClose, onDone }: { machineId: number; token: string; onClose: () => void; onDone: () => void }) {
  const DENOMS = [1, 5, 10];
  const [denom, setDenom] = useState(10);
  const [qty, setQty] = useState(10);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async () => {
    setLoading(true);
    const res = await API.addCash(machineId, denom, qty, token);
    setLoading(false);
    if (res.message) { setMsg("✅ " + res.message); onDone(); }
    else setMsg("❌ " + (res.detail || JSON.stringify(res)));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>💰 เติมเงิน/เหรียญ (Machine #{machineId})</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: "0.85rem", color: "var(--mrt-text-muted)", marginBottom: 6, display: "block" }}>ชนิดเหรียญ</label>
          <div style={{ display: "flex", gap: 8 }}>
            {DENOMS.map(d => (
              <button key={d} onClick={() => setDenom(d)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `2px solid ${denom === d ? "var(--mrt-blue-light)" : "var(--mrt-border)"}`, background: denom === d ? "rgba(45,91,227,0.2)" : "transparent", color: denom === d ? "#93c5fd" : "var(--mrt-text-muted)", cursor: "pointer", fontFamily: "'Noto Sans Thai',sans-serif", fontWeight: 600 }}>{d} บาท</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: "0.85rem", color: "var(--mrt-text-muted)", marginBottom: 6, display: "block" }}>จำนวน</label>
          <input id="add-cash-qty" className="mrt-input" type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} />
          <p style={{ fontSize: "0.8rem", color: "var(--mrt-text-muted)", marginTop: 4 }}>
            รวม: {denom * qty} ฿ ({qty} เหรียญ × {denom} บาท)
          </p>
        </div>
        {msg && <p style={{ marginBottom: 12, color: msg.startsWith("✅") ? "#86efac" : "#fca5a5", fontSize: "0.9rem" }}>{msg}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-danger" style={{ flex: 1 }} onClick={onClose}>ปิด</button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={submit} disabled={loading}>{loading ? "กำลังเติม..." : "เติมเงิน"}</button>
        </div>
      </div>
    </div>
  );
}

// Adjust Ticket Modal
function AdjustModal({ token, stations, onClose }: { token: string; stations: Station[]; onClose: () => void }) {
  const [ticketId, setTicketId] = useState("");
  const [newStationId, setNewStationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; msg: string; amount?: number } | null>(null);

  const blue = stations.filter(s => s.line === "blue");
  const purple = stations.filter(s => s.line === "purple");

  const submit = async () => {
    if (!ticketId || !newStationId) return;
    setLoading(true);
    const res = await API.adjustTicket(Number(ticketId), newStationId, token);
    setLoading(false);
    if (res.ticket_id) {
      setResult({ success: true, msg: `เปลี่ยนปลายทางสำเร็จ → สถานี ID: ${res.new_station_id}`, amount: res.amount_to_pay });
    } else {
      setResult({ success: false, msg: res.detail || JSON.stringify(res) });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 6 }}>🗺️ เปลี่ยนสถานีปลายทางผู้โดยสาร</h3>
        <p style={{ color: "var(--mrt-text-muted)", fontSize: "0.85rem", marginBottom: 16 }}>ตั๋วต้องอยู่ในสถานะ in_system (แตะเข้าแล้ว)</p>

        {!result ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: "0.85rem", color: "var(--mrt-text-muted)", marginBottom: 6, display: "block" }}>🎫 Ticket ID</label>
              <input id="adjust-ticket-id" className="mrt-input" type="number" placeholder="กรอก Ticket ID" value={ticketId} onChange={e => setTicketId(e.target.value)} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: "0.85rem", color: "var(--mrt-text-muted)", marginBottom: 6, display: "block" }}>📍 สถานีปลายทางใหม่</label>
              <select id="adjust-new-station" className="mrt-input" value={newStationId ?? ""} onChange={e => setNewStationId(Number(e.target.value))}>
                <option value="">-- เลือกสถานี --</option>
                <optgroup label="สาย Blue">{blue.map(s => <option key={s.id} value={s.id}>{s.code} {s.name}</option>)}</optgroup>
                <optgroup label="สาย Purple">{purple.map(s => <option key={s.id} value={s.id}>{s.code} {s.name}</option>)}</optgroup>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-danger" style={{ flex: 1 }} onClick={onClose}>ยกเลิก</button>
              <button className="btn-primary" style={{ flex: 1 }} disabled={!ticketId || !newStationId || loading} onClick={submit}>
                {loading ? "กำลังเปลี่ยน..." : "ยืนยันการเปลี่ยน"}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>{result.success ? "✅" : "❌"}</div>
            <p style={{ color: result.success ? "#86efac" : "#fca5a5", fontWeight: 600, marginBottom: 8 }}>{result.msg}</p>
            {result.success && result.amount !== undefined && result.amount > 0 && (
              <div style={{ background: "rgba(245,197,24,0.1)", border: "1px solid rgba(245,197,24,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 16 }}>
                <span style={{ color: "var(--mrt-gold)", fontWeight: 700 }}>⚠️ เก็บเงินเพิ่ม {result.amount} ฿</span>
              </div>
            )}
            {result.success && result.amount === 0 && (
              <p style={{ color: "var(--mrt-text-muted)", fontSize: "0.85rem", marginBottom: 16 }}>ไม่ต้องเก็บเงินเพิ่ม</p>
            )}
            <button className="btn-primary" style={{ width: "100%" }} onClick={onClose}>ปิด</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [token, setToken] = useState("");
  const [modal, setModal] = useState<{ type: "restock" | "cash" | "adjust"; machineId?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMachines = async (t: string) => {
    const res = await API.getMachines(t);
    if (Array.isArray(res)) setMachines(res);
    else { router.push("/admin"); }
    setLoading(false);
  };

  useEffect(() => {
    const t = localStorage.getItem("mrt_admin_token") || "";
    if (!t) { router.push("/admin"); return; }
    setToken(t);
    fetchMachines(t);
    API.getStations().then(d => { if (Array.isArray(d)) setStations(d); });
  }, []);

  const stationName = (id: number) => stations.find(s => s.id === id)?.name ?? `Station ${id}`;
  const stationCode = (id: number) => stations.find(s => s.id === id)?.code ?? "";
  const stationLine = (id: number) => stations.find(s => s.id === id)?.line ?? "blue";

  const logout = () => { localStorage.removeItem("mrt_admin_token"); router.push("/admin"); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="mrt-header" style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "1.5rem" }}>←</Link>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>⚙️ Admin Dashboard</div>
            <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>ระบบจัดการเครื่องจำหน่ายตั๋ว MRT</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            id="adjust-destination-btn"
            className="btn-outline"
            style={{ fontSize: "0.85rem", padding: "8px 14px" }}
            onClick={() => setModal({ type: "adjust" })}
          >
            🗺️ เปลี่ยนปลายทางผู้โดยสาร
          </button>
          <button className="btn-danger" style={{ padding: "8px 14px", fontSize: "0.85rem" }} onClick={logout}>ออกจากระบบ</button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: "var(--mrt-surface2)", borderBottom: "1px solid var(--mrt-border)", padding: "12px 24px", display: "flex", gap: 24 }}>
        <div>
          <span style={{ color: "var(--mrt-text-muted)", fontSize: "0.8rem" }}>เครื่องทั้งหมด</span>
          <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>{machines.length}</div>
        </div>
        <div>
          <span style={{ color: "var(--mrt-text-muted)", fontSize: "0.8rem" }}>เครื่องที่ใช้งานได้</span>
          <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#86efac" }}>{machines.filter(m => m.is_active).length}</div>
        </div>
        <div>
          <span style={{ color: "var(--mrt-text-muted)", fontSize: "0.8rem" }}>ตั๋วรวม (ทุกตู้)</span>
          <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#93c5fd" }}>{machines.reduce((s, m) => s + m.ticket_stock, 0).toLocaleString()}</div>
        </div>
        <div>
          <span style={{ color: "var(--mrt-text-muted)", fontSize: "0.8rem" }}>เงินสดรวม</span>
          <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--mrt-gold)" }}>{machines.reduce((s, m) => s + m.cash_float_balance, 0).toLocaleString()} ฿</div>
        </div>
      </div>

      {/* Machine grid */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--mrt-text-muted)" }}>กำลังโหลด...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {machines.map(m => {
              const line = stationLine(m.station_id);
              return (
                <div key={m.id} className="glass" style={{ padding: 18, transition: "transform 0.2s", cursor: "default" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <span className={line === "blue" ? "badge-blue" : "badge-purple"} style={{ marginBottom: 4, display: "inline-block" }}>
                        {stationCode(m.station_id)}
                      </span>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{stationName(m.station_id)}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--mrt-text-muted)" }}>Machine #{m.id}</div>
                    </div>
                    <span className={m.is_active ? "badge-green" : "badge-red"}>
                      {m.is_active ? "ใช้งานได้" : "ปิดใช้งาน"}
                    </span>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--mrt-text-muted)" }}>🎫 Token/ตั๋ว</div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: m.ticket_stock < 10 ? "#fca5a5" : "#93c5fd" }}>{m.ticket_stock}</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--mrt-text-muted)" }}>💰 ยอดเงิน</div>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--mrt-gold)" }}>{m.cash_float_balance} ฿</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 1, padding: "8px 0", fontSize: "0.8rem" }}
                      onClick={() => setModal({ type: "restock", machineId: m.id })}
                    >
                      🎫 เติม Token
                    </button>
                    <button
                      className="btn-outline"
                      style={{ flex: 1, padding: "8px 0", fontSize: "0.8rem" }}
                      onClick={() => setModal({ type: "cash", machineId: m.id })}
                    >
                      💰 เติมเงิน
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "restock" && modal.machineId && (
        <RestockModal
          machineId={modal.machineId}
          token={token}
          onClose={() => setModal(null)}
          onDone={() => fetchMachines(token)}
        />
      )}
      {modal?.type === "cash" && modal.machineId && (
        <AddCashModal
          machineId={modal.machineId}
          token={token}
          onClose={() => setModal(null)}
          onDone={() => fetchMachines(token)}
        />
      )}
      {modal?.type === "adjust" && (
        <AdjustModal token={token} stations={stations} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
