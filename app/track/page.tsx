"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Order = {
  id: string;
  game_name: string;
  package_name: string;
  price: number;
  status: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "รอตรวจสอบ", color: "#FFC857" },
  paid: { label: "ชำระเงินแล้ว", color: "#29E7CD" },
  completed: { label: "เติมสำเร็จ", color: "#29E7CD" },
  rejected: { label: "ถูกปฏิเสธ", color: "#FF5A6E" },
};

export default function TrackPage() {
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<Order | null | undefined>(undefined); // undefined = ยังไม่ค้นหา, null = ไม่พบ
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .ilike("id", code.trim())
      .maybeSingle();
    setOrder((data as Order) ?? null);
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "32px 16px" }}>
      <h1 className="display-font" style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>ตรวจสอบสถานะออเดอร์</h1>
      <p style={{ color: "#A79FC7", fontSize: 14, marginBottom: 24 }}>กรอกรหัสออเดอร์ที่ได้รับตอนสั่งซื้อ</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="เช่น ORD-AB12CD"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 8, background: "#1F1640", border: "1px solid #2A2154", color: "#F5F2FF" }}
        />
        <button onClick={search} style={{ padding: "0 18px", borderRadius: 8, background: "#FF3D8A", color: "#150E2E", border: "none", fontWeight: 700 }}>
          {loading ? "..." : "ค้นหา"}
        </button>
      </div>

      {order === null && <p style={{ color: "#FF5A6E", fontSize: 14 }}>ไม่พบออเดอร์นี้ กรุณาตรวจสอบรหัสอีกครั้ง</p>}

      {order && (
        <div style={{ background: "#1F1640", border: "1px solid #2A2154", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span className="display-font" style={{ fontWeight: 700 }}>{order.id}</span>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 999,
              background: `${STATUS_LABEL[order.status]?.color}22`,
              color: STATUS_LABEL[order.status]?.color,
            }}>
              {STATUS_LABEL[order.status]?.label ?? order.status}
            </span>
          </div>
          <Row label="เกม" value={order.game_name} />
          <Row label="แพ็กเกจ" value={order.package_name} />
          <Row label="ยอดชำระ" value={`฿${order.price}`} />
          <Row label="วันที่สั่งซื้อ" value={new Date(order.created_at).toLocaleString("th-TH")} />
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#A79FC7", padding: "6px 0" }}>
      <span>{label}</span>
      <span style={{ color: "#F5F2FF" }}>{value}</span>
    </div>
  );
}