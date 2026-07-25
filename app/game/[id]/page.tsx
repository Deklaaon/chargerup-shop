"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../lib/AuthProvider";

type Game = { id: string; name: string; field_label: string; color: string };
type Pkg = { id: string; name: string; price: number; stock: number };

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [game, setGame] = useState<Game | null>(null);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [selected, setSelected] = useState<Pkg | null>(null);
  const [gameUserId, setGameUserId] = useState("");
  const [method, setMethod] = useState<"slip" | "gateway">("slip");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [doneCode, setDoneCode] = useState<string | null>(null);

  useEffect(() => {
  console.log("id จาก URL:", id);
  supabase.from("games").select("*").eq("id", id).single().then((res) => {
    console.log("ผลลัพธ์ games:", res);
    setGame(res.data as Game);
  });
  supabase.from("packages").select("*").eq("game_id", id).then((res) => {
    console.log("ผลลัพธ์ packages:", res);
    setPackages((res.data as Pkg[]) || []);
  });
}, [id]);

  const submit = async () => {
    if (!selected) return;
    if (!gameUserId.trim()) { setErr(`กรอก ${game?.field_label}`); return; }
    if (method === "slip" && !slipFile) { setErr("แนบสลิปการโอนเงิน"); return; }
    setErr("");
    setSubmitting(true);

    let slipUrl: string | null = null;
    if (slipFile) {
      const fileName = `${Date.now()}_${slipFile.name}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("slips")
        .upload(fileName, slipFile);
      if (uploadErr) { setErr("อัปโหลดสลิปไม่สำเร็จ: " + uploadErr.message); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from("slips").getPublicUrl(uploadData.path);
      slipUrl = urlData.publicUrl;
    }

    const orderId = "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from("orders").insert({
      id: orderId,
      user_id: user?.id ?? null,
      game_id: game?.id,
      game_name: game?.name,
      package_name: selected.name,
      price: selected.price,
      game_user_id: gameUserId.trim(),
      method,
      slip_img: slipUrl,
      status: method === "slip" ? "pending" : "paid",
    });

    setSubmitting(false);
    if (error) { setErr("ส่งคำสั่งซื้อไม่สำเร็จ: " + error.message); return; }
    setDoneCode(orderId);
  };

  if (!game) return <main style={{ maxWidth: 700, margin: "0 auto", padding: 24, color: "#A79FC7" }}>กำลังโหลด...</main>;

  if (doneCode) {
    return (
      <main style={{ maxWidth: 400, margin: "60px auto", padding: 24, textAlign: "center" }}>
        <h2 className="display-font" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>ส่งคำสั่งซื้อสำเร็จ</h2>
        <p style={{ color: "#A79FC7", marginBottom: 20 }}>เก็บรหัสนี้ไว้ตรวจสอบสถานะ</p>
        <div style={{ border: "1px dashed #2A2154", borderRadius: 12, padding: 16, marginBottom: 20, background: "#1F1640" }}>
          <span className="display-font" style={{ fontSize: 18, fontWeight: 700 }}>{doneCode}</span>
        </div>
        <button onClick={() => router.push("/track")}
          style={{ width: "100%", padding: 14, borderRadius: 12, background: "#FF3D8A", color: "#150E2E", fontWeight: 700, border: "none" }}>
          ไปหน้าตรวจสอบสถานะ
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 500, margin: "0 auto", padding: "24px 16px" }}>
      <h1 className="display-font" style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{game.name}</h1>

      <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
        {packages.map((p) => (
          <button key={p.id} onClick={() => setSelected(p)} disabled={p.stock <= 0}
            style={{ textAlign: "left", padding: 14, borderRadius: 12, background: selected?.id === p.id ? `${game.color}22` : "#1F1640",
              border: `1px solid ${selected?.id === p.id ? game.color : "#2A2154"}`, color: "#F5F2FF", display: "flex", justifyContent: "space-between" }}>
            <span>{p.name}{p.stock <= 0 && " (สินค้าหมด)"}</span>
            <b style={{ color: game.color }}>฿{p.price}</b>
          </button>
        ))}
      </div>

      {selected && (
        <>
          <label style={{ fontSize: 12, color: "#A79FC7" }}>{game.field_label}</label>
          <input value={gameUserId} onChange={(e) => setGameUserId(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", marginTop: 6, marginBottom: 16, borderRadius: 8, background: "#1F1640", border: "1px solid #2A2154", color: "#F5F2FF" }} />

          <p style={{ fontSize: 12, color: "#A79FC7", marginBottom: 8 }}>วิธีชำระเงิน</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setMethod("slip")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: method === "slip" ? "#FF3D8A22" : "#1F1640", border: `1px solid ${method === "slip" ? "#FF3D8A" : "#2A2154"}`, color: method === "slip" ? "#FF3D8A" : "#A79FC7" }}>โอน + แนบสลิป</button>
            <button onClick={() => setMethod("gateway")} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: method === "gateway" ? "#FF3D8A22" : "#1F1640", border: `1px solid ${method === "gateway" ? "#FF3D8A" : "#2A2154"}`, color: method === "gateway" ? "#FF3D8A" : "#A79FC7" }}>Gateway</button>
          </div>

          {method === "slip" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#A79FC7", background: "#1F1640", border: "1px solid #2A2154", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                โอนมาที่พร้อมเพย์ 099-xxx-xxxx (ชื่อร้าน) แล้วแนบสลิป
              </div>
              <input type="file" accept="image/*" onChange={(e) => setSlipFile(e.target.files?.[0] ?? null)} />
            </div>
          )}

          {err && <p style={{ color: "#FF5A6E", fontSize: 13, marginBottom: 12 }}>{err}</p>}

          <button disabled={submitting} onClick={submit}
            style={{ width: "100%", padding: 14, borderRadius: 12, background: "#FF3D8A", color: "#150E2E", fontWeight: 700, border: "none" }}>
            {submitting ? "กำลังส่ง..." : `ยืนยันคำสั่งซื้อ · ฿${selected.price}`}
          </button>
        </>
      )}
    </main>
  );
}