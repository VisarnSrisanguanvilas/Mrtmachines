"use client";
import { useEffect, useState } from "react";
import { API, Station } from "@/lib/api";
import Link from "next/link";

// --- Payment Modal ---
function PaymentModal({
  fare, fromId, toId, fromName, toName,
  onClose, onSuccess,
}: {
  fare: number; fromId: number; toId: number;
  fromName: string; toName: string;
  onClose: () => void;
  onSuccess: (res: { ticket_id: number; change: number; change_breakdown: Record<string, number> }) => void;
}) {
  const [qty, setQty] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const DENOMS = [
    { value: 1, label: "1 บาท", type: "coin" },
    { value: 5, label: "5 บาท", type: "coin" },
    { value: 10, label: "10 บาท", type: "coin" },
    { value: 20, label: "20 บาท", type: "bill" },
    { value: 50, label: "50 บาท", type: "bill" },
    { value: 100, label: "100 บาท", type: "bill" },
  ];

  const total = Object.entries(qty).reduce((s, [d, q]) => s + Number(d) * q, 0);

  const changeQty = (denom: number, delta: number) => {
    setQty(prev => {
      const next = { ...prev, [denom]: Math.max(0, (prev[denom] ?? 0) + delta) };
      if (next[denom] === 0) delete next[denom];
      return next;
    });
  };

  const handlePurchase = async () => {
    if (total < fare) { setErr(`ยังใส่เงินไม่พอ ต้องการอีก ${fare - total} บาท`); return; }
    setLoading(true); setErr("");
    const items: Record<string, number> = {};
    Object.entries(qty).forEach(([d, q]) => { if (q > 0) items[d] = q; });
    const res = await API.purchaseTicket(fromId, toId, total, items);
    setLoading(false);
    if (res.ticket_id) {
      onSuccess({ ticket_id: res.ticket_id, change: res.change, change_breakdown: res.change_breakdown ?? {} });
    } else {
      setErr(res.detail || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-1000">
      <div className="bg-white p-[30px] rounded-3xl w-[450px] text-[#333]">
        <h2 className="text-[1.8rem] font-extrabold text-(--mrt-blue) mb-5">💳 ชำระค่าโดยสาร</h2>
        <div className="bg-slate-100 p-5 rounded-xl mb-5 flex justify-between items-center">
          <span className="text-[1.2rem]">ค่าโดยสาร:</span>
          <span className="text-[2rem] font-black text-(--mrt-blue)">{fare} ฿</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {DENOMS.map(d => (
            <div key={d.value} className="border border-slate-200 p-2.5 rounded-xl flex justify-between items-center">
              <span className="font-bold">{d.label}</span>
              <div className="flex items-center gap-2.5">
                <button onClick={() => changeQty(d.value, -1)} className="w-[30px] h-[30px] rounded-full border border-slate-300">-</button>
                <span className="font-bold">{qty[d.value] ?? 0}</span>
                <button onClick={() => changeQty(d.value, 1)} className="w-[30px] h-[30px] rounded-full border border-slate-300">+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-[1.5rem] font-black mb-5">
          <span>รวมที่ใส่:</span>
          <span className={total >= fare ? "text-emerald-600" : "text-rose-600"}>{total} ฿</span>
        </div>

        {err && <div className="text-rose-600 mb-4 font-bold">⚠️ {err}</div>}

        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 p-[15px] rounded-xl bg-slate-500 text-white font-bold">ยกเลิก</button>
          <button onClick={handlePurchase} disabled={loading || total < fare} className="flex-2 p-[15px] rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50 transition-colors hover:bg-emerald-700">
            {loading ? "กำลังซื้อ..." : "ยืนยันการซื้อ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Ticket Receipt ---
function TicketReceipt({ ticket_id, change, fromName, toName, fare, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-1000">
      <div className="bg-white p-10 rounded-3xl w-[400px] text-center text-[#333]">
        <div className="text-[4rem] mb-2.5">🎫</div>
        <h2 className="text-[2rem] font-black text-emerald-600 mb-2.5">ซื้อสำเร็จ!</h2>
        <div className="border-2 border-dashed border-slate-200 p-5 rounded-xl mb-5">
          <div className="flex justify-between mb-2.5">
            <span>Ticket ID:</span>
            <span className="font-black">#{ticket_id}</span>
          </div>
          <div className="text-left mb-2.5">
            <div className="text-sm text-slate-500">จาก: {fromName}</div>
            <div className="text-sm text-slate-500">ถึง: {toName}</div>
          </div>
          <div className="border-t border-slate-100 pt-2.5 flex justify-between">
            <span>ค่าโดยสาร:</span>
            <span className="font-black">{fare} ฿</span>
          </div>
        </div>
        {change > 0 && <div className="text-[1.3rem] font-black text-(--mrt-blue) mb-5">เงินทอน: {change} ฿</div>}
        <button onClick={onClose} className="w-full p-[15px] rounded-xl bg-(--mrt-blue) text-white font-bold hover:bg-(--mrt-blue-dark) transition-colors">เสร็จสิ้น</button>
      </div>
    </div>
  );
}

// --- MRT Map SVG ---
function MrtMap({ stations, selectedFrom, selectedTo, onSelect, activeLine }: any) {
  if (!stations.length) return <div className="text-center p-12 text-slate-400">Loading Map...</div>;

  const allX = stations.map((s: any) => s.x);
  const allY = stations.map((s: any) => s.y);
  const minX = Math.min(...allX) - 120;
  const minY = Math.min(...allY) - 120;
  const maxX = Math.max(...allX) + 180;
  const maxY = Math.max(...allY) + 120;
  const vw = maxX - minX;
  const vh = maxY - minY;

  const blue = stations.filter((s: any) => s.line === "blue");
  const purple = stations.filter((s: any) => s.line === "purple").sort((a: any, b: any) => a.id - b.id);

  const blueMain = blue.filter((s: any) => {
    const n = parseInt(s.code.replace(/\D/g, ''));
    return n >= 1 && n <= 32;
  }).sort((a: any, b: any) => parseInt(a.code.replace(/\D/g, '')) - parseInt(b.code.replace(/\D/g, '')));

  const blueExt = [
    blue.find((s: any) => s.id === 1), // Hub at Tha Phra
    ...blue.filter((s: any) => {
      const n = parseInt(s.code.replace(/\D/g, ''));
      return n >= 33 && n <= 38;
    }).sort((a: any, b: any) => parseInt(a.code.replace(/\D/g, '')) - parseInt(b.code.replace(/\D/g, '')))
  ].filter(Boolean) as Station[];

  const pathD = (pts: Station[]) => pts.map((s, i) => `${i === 0 ? "M" : "L"} ${s.x - minX} ${s.y - minY}`).join(" ");

  const blueLoopPath = blueMain.length > 0 ? pathD(blueMain) + ` L ${blueMain[0].x - minX} ${blueMain[0].y - minY}` : "";
  const blueExtPath = blueExt.length > 0 ? pathD(blueExt) : "";
  const purplePath = pathD(purple);

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full h-full">
      {/* Lines */}
      <g opacity={activeLine === "blue" ? 1 : 0} className="transition-opacity duration-500">
        <path d={blueLoopPath} fill="none" stroke="var(--mrt-blue)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
        <path d={blueExtPath} fill="none" stroke="var(--mrt-blue)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d={purplePath} fill="none" stroke="var(--mrt-purple)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" className="transition-opacity duration-500" opacity={activeLine === "purple" ? 1 : 0} />

      {/* Stations */}
      {stations.map((s: any) => {
        const cx = s.x - minX;
        const cy = s.y - minY;
        const isFrom = s.id === selectedFrom;
        const isTo = s.id === selectedTo;
        const isSelected = isFrom || isTo;
        const circleColor = isSelected ? "#e11d48" : (s.line === "blue" ? "#1a3a8f" : "#7b2d8b");
        const radius = isSelected ? 30 : 30;

        // Precise label position logic based on station codes (Blue Line)
        let labelX = cx;
        let labelY = cy;
        let textAnchor = "start";
        let verticalOffset = 5;
        let barOffset = 12;

        const codeNum = parseInt(s.code.replace(/\D/g, ''));

        if (s.line === "blue") {
          if (codeNum >= 2 && codeNum <= 12) {
            // Left segment
            labelX = cx - 35; textAnchor = "end";
          } else if (codeNum >= 13 && codeNum <= 16) {
            // Top segment - Alternating like the picture
            if (codeNum === 13 || codeNum === 15) { labelY = cy - 35; textAnchor = "middle"; }
            else { labelY = cy + 45; textAnchor = "middle"; }
          } else if (codeNum >= 17 && codeNum <= 28) {
            // Right segment
            labelX = cx + 35; textAnchor = "start";
          } else if (codeNum >= 29 && codeNum <= 32 || codeNum === 1) {
            // Bottom segment
            labelY = cy + 55; textAnchor = "middle";
          } else if (codeNum >= 33 && codeNum <= 35) {
            // Bottom spur
            labelY = cy + 55; textAnchor = "middle";
          } else if (codeNum >= 36 && codeNum <= 38) {
            // Left spur
            labelX = cx - 35; textAnchor = "end";
          }
        } else {
          // Purple line (General heuristic)
          if (cx < 200) { labelX = cx - 35; textAnchor = "end"; }
          else { labelX = cx + 35; textAnchor = "start"; }
        }

        return (
          <g key={s.id} onClick={() => onSelect(s.id)} className="cursor-pointer transition-opacity duration-500" opacity={s.line === activeLine ? 1 : 0} style={{ pointerEvents: s.line === activeLine ? "auto" : "none" }}>
            <circle cx={cx} cy={cy} r={radius} fill={circleColor} stroke="white" strokeWidth={2} />
            {!isSelected && (
              <text x={cx} y={cy + 5} textAnchor="middle" fill="white" className="text-[20px] font-black pointer-events-none tracking-tighter">
                {s.code}
              </text>
            )}

            {/* Station Name */}
            <g className="pointer-events-none">
              <text x={labelX} y={labelY + verticalOffset} textAnchor={textAnchor} fill="#000" className="text-[15px] font-bold">
                {s.name}
              </text>
              {/* Interchange Indicators */}
              {(s.name === "สวนจตุจักร" || s.name === "สุขุมวิท" || s.name === "สีลม" || s.name === "ท่าพระ") && (
                <rect
                  x={textAnchor === "middle" ? labelX - 15 : textAnchor === "end" ? labelX - 30 : labelX}
                  y={labelY + barOffset}
                  width={30} height={4} fill="#10b981"
                />
              )}
              {(s.name === "เตาปูน") && (
                <rect
                  x={textAnchor === "middle" ? labelX - 15 : textAnchor === "end" ? labelX - 30 : labelX}
                  y={labelY + barOffset}
                  width={30} height={4} fill="#7b2d8b"
                />
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// --- Main Page ---
export default function KioskPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [fromId, setFromId] = useState<number | null>(null);
  const [toId, setToId] = useState<number | null>(null);
  const [fare, setFare] = useState<number | null>(null);
  const [lang, setLang] = useState<"th" | "en">("th");
  const [activeLine, setActiveLine] = useState<"blue" | "purple">("blue");
  const [showPayment, setShowPayment] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    API.getStations().then(setStations);
  }, []);

  useEffect(() => {
    if (fromId && toId && fromId !== toId) {
      API.calculateFare(fromId, toId).then(res => setFare(res.fare ?? 0));
    } else {
      setFare(null);
    }
  }, [fromId, toId]);

  const stationName = (id: number | null) => {
    if (!id) return "";
    const s = stations.find(s => s.id === id);
    return s ? (lang === "th" ? s.name : s.name_en) : "";
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white text-slate-800 overflow-hidden font-['Noto_Sans_Thai','Inter']">

      {/* HEADER */}
      <header className="bg-(--mrt-blue) px-10 py-[15px] flex justify-between items-center text-white shadow-lg">
        <div className="flex gap-5">
          <div className="text-[2.5rem]">🪙</div>
          <div className="text-[2.5rem]">💵</div>
        </div>

        <div className="text-center">
          <div className="text-[1.8rem] font-bold">ยินดีต้อนรับ</div>
          <div className="text-[1.8rem] font-medium">Welcome</div>
        </div>

        <button
          onClick={() => setLang(lang === "th" ? "en" : "th")}
          className="bg-white text-(--mrt-blue) px-[25px] py-2.5 rounded-lg font-bold cursor-pointer text-[1.2rem] hover:bg-slate-50 transition-colors"
        >
          {lang === "th" ? "English" : "ภาษาไทย"}
        </button>
      </header>

      {/* BODY */}
      <main className="flex-1 flex overflow-hidden">

        {/* LEFT: MAP */}
        <section className="flex-1 relative p-5 bg-slate-50/30">
          {/* Line Switcher */}
          <div className="absolute top-5 left-5 z-10 flex flex-col gap-2">
            <button
              onClick={() => setActiveLine("blue")}
              className={`w-[110px] h-[65px] border-none font-black cursor-pointer text-lg shadow-lg transition-all rounded-md ${activeLine === "blue" ? "bg-(--mrt-blue) text-white ring-2 ring-white" : "bg-slate-300 text-slate-600 hover:bg-slate-400"}`}
            >
              BLUE
            </button>
            <button
              onClick={() => setActiveLine("purple")}
              className={`w-[110px] h-[65px] border-none font-black cursor-pointer text-lg shadow-lg transition-all rounded-md ${activeLine === "purple" ? "bg-(--mrt-purple) text-white ring-2 ring-white" : "bg-slate-300 text-slate-600 hover:bg-slate-400"}`}
            >
              PURPLE
            </button>
          </div>

          <MrtMap
            stations={stations}
            selectedFrom={fromId}
            selectedTo={toId}
            activeLine={activeLine}
            onSelect={(id: number) => {
              if (!fromId) setFromId(id);
              else if (!toId) setToId(id);
              else { setFromId(id); setToId(null); }
            }}
          />
        </section>

        {/* RIGHT: SELECTION */}
        <aside className="w-[450px] border-l-4 border-l-(--mrt-blue) p-[40px_30px] flex flex-col shadow-2xl z-10 bg-white">

          <div className="text-center mb-10">
            <h2 className="text-(--mrt-blue) text-[2.8rem] font-black m-0 whitespace-pre-line leading-tight">
              {!fromId ? "กรุณาเลือก\nสถานีต้นทาง" : !toId ? "กรุณาเลือก\nสถานีปลายทาง" : "ตรวจสอบข้อมูล"}
            </h2>
          </div>

          <div className="flex flex-col gap-[30px]">

            {/* Origin Box */}
            <div className="border-b-4 border-b-slate-800 relative">
              <div className="text-[1.8rem] font-bold mb-[5px]">ท่านอยู่สถานีที่</div>
              <div className="h-[60px] text-[2.2rem] font-black text-(--mrt-blue) flex items-center">
                {stationName(fromId)}
              </div>
              <div className="absolute left-[-5px] bottom-0 top-1/2 w-1 bg-slate-800" />
              <div className="absolute right-[-5px] bottom-0 top-1/2 w-1 bg-slate-800" />
            </div>

            {/* Destination Box */}
            <div className="border-b-4 border-b-slate-800 relative">
              <div className="text-[1.8rem] font-bold mb-[5px]">สถานีปลายทาง</div>
              <div className="h-[60px] text-[2.2rem] font-black text-(--mrt-blue) flex items-center">
                {stationName(toId)}
              </div>
              <div className="absolute left-[-5px] bottom-0 top-1/2 w-1 bg-slate-800" />
              <div className="absolute right-[-5px] bottom-0 top-1/2 w-1 bg-slate-800" />
            </div>

            {/* Fare Box */}
            <div className="border-b-4 border-b-slate-800 relative pb-1">
              <div className="text-[1.8rem] font-bold mb-[5px]">ค่าโดยสาร</div>
              <div className="flex justify-end items-baseline gap-2.5">
                <div className="text-[4.5rem] font-black tracking-tighter">{fare !== null ? fare : ""}</div>
                <div className="text-[1.8rem] font-bold">บาท</div>
              </div>
              <div className="absolute left-[-5px] bottom-0 top-1/2 w-1 bg-slate-800" />
              <div className="absolute right-[-5px] bottom-0 top-1/2 w-1 bg-slate-800" />
            </div>

          </div>

          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            {fromId && toId && fare !== null && (
              <button
                onClick={() => setShowPayment(true)}
                className="w-full p-[15px] bg-emerald-600 text-white text-[2rem] font-black border-none cursor-pointer rounded-xl hover:bg-emerald-700 shadow-lg transition-all active:scale-95"
              >
                ยืนยันการซื้อ
              </button>
            )}

            <button
              onClick={() => { setFromId(null); setToId(null); setFare(null); }}
              className="w-full p-5 bg-rose-600 text-white text-[2.5rem] font-black border-none cursor-pointer rounded-xl hover:bg-rose-700 shadow-lg transition-all active:scale-95"
            >
              ยกเลิก
            </button>
          </div>

        </aside>
      </main>

      {/* Modals */}
      {showPayment && fromId && toId && fare !== null && (
        <PaymentModal
          fare={fare}
          fromId={fromId}
          toId={toId}
          fromName={stationName(fromId)}
          toName={stationName(toId)}
          onClose={() => setShowPayment(false)}
          onSuccess={res => { setShowPayment(false); setReceipt(res); }}
        />
      )}
      {receipt && (
        <TicketReceipt
          {...receipt}
          fromName={stationName(fromId)}
          toName={stationName(toId)}
          fare={fare}
          onClose={() => { setReceipt(null); setFromId(null); setToId(null); }}
        />
      )}
    </div>
  );
}
