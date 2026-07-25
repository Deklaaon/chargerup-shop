"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthProvider";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

type Topup = { id: string; amount: number; slip_img: string; status: string; created_at: string };

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "รอตรวจสอบ", color: "#FFC857" },
  approved: { label: "อนุมัติแล้ว", color: "#29E7CD" },
  rejected: { label: "ถูกปฏิเสธ", color: "#FF5A6E" },
};

export default function AccountPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [topups, setTopups] = useState<Topup[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) loadTopups();
  }, [user]);

  const loadTopups = async () => {
    const { data } = await supabase.from("wallet_topups").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTopups((data as Topup[]) || []);
  };

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { setErr("กรอกจำนวนเงินให้ถูกต้อง"); return; }
    if (!file) { setErr("แนบสลิปการโอนเงิน"); return; }
    setErr("");
    setBusy(true);

    const fileName = `topup_${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage.from("slips").upload(fileName, file);
    if (uploadErr) { setErr("อัปโหลดสลิปไม่สำเร็จ: " + uploadErr.message); setBusy(false); return; }
    const { data: urlData } = supabase.storage.from("slips").getPublicUrl(uploadData.path);

    const { error } = await supabase.from("wallet_topups").insert({
      id: "TP-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      user_id: user.id,
      amount: amt,
      slip_img: urlData.publicUrl,
      status: "pending",
    });

    setBusy(false);
    if (error) { setErr("ส่งคำขอไม่สำเร็จ: " + error.message); return; }
    setSent(true);
    setAmount("");
    setFile(null);
    loadTopups();
  };

  if (loading || !profile) return <main style={{ padding: 40, color: "#A79FC7" }}>กำลังโหลด...</main>;

  return (
    <main style={{ maxWidth: 500, margin: "0 auto", padding: "24px 16px" }}>
      <h1 className="display-font" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{profile.username}</h1>

      <div style={{ background: "linear-gradient(135deg,#29E7CD22,#8C6CFF22)", border: "1px solid #2A2154", borderRadius: 16, padding: 20, margin: "20px 0" }}>
        <p style={{ fontSize: 12, color: "#A79FC7" }}>ยอดเงินในกระเป๋า</p>
        <p className="display-font" style={{ fontSize: 28, fontWeight: 700, color: "#29E7CD" }}>฿{profile.wallet.toLocaleString()}</p>
      </div>

      <div style={{ background: "#1F1640", border: "1px solid #2A2154", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <p style={{ fontWeight: 600, marginBottom: 12 }}>เติมเงินเข้ากระเป๋า</p>
        {sent ? (
          <p style={{ color: "#29E7CD", fontSize: 14 }}>ส่งคำขอแล้ว รอแอดมินตรวจสอบ</p>
        ) : (
          <>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="จำนวนเงิน (บาท)"
              style={{ width: "100%", padding: "10px 12px", marginBottom: 10, borderRadius: 8, background: "#150E2E", border: "1px solid #2A2154", color: "#F5F2FF" }} />
            <div style={{ fontSize: 12, color: "#A79FC7", background: "#150E2E", border: "1px solid #2A2154", borderRadius: 8, padding: 10, marginBottom: 10 }}>
              โอนมาที่พร้อมเพย์ 099-xxx-xxxx (ชื่อร้าน) แล้วแนบสลิป
            </div>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ marginBottom: 10 }} />
            {err && <p style={{ color: "#FF5A6E", fontSize: 13, marginBottom: 10 }}>{err}</p>}
            <button disabled={busy} onClick={submit}
              style={{ width: "100%", padding: 12, borderRadius: 10, background: "#29E7CD", color: "#150E2E", fontWeight: 700, border: "none" }}>
              {busy ? "กำลังส่ง..." : "ส่งคำขอเติมเงิน"}
            </button>
          </>
        )}
      </div>

      <p style={{ fontWeight: 600, marginBottom: 10 }}>ประวัติการเติมเงิน</p>
      {topups.length === 0 && <p style={{ fontSize: 13, color: "#5C5480" }}>ยังไม่มีประวัติ</p>}
      {topups.map((t) => (
        <div key={t.id} style={{ display: "flex", justifyContent: "space-between", background: "#1F1640", border: "1px solid #2A2154", borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 13 }}>
          <span>฿{t.amount.toLocaleString()}</span>
          <span style={{ color: STATUS_LABEL[t.status].color }}>{STATUS_LABEL[t.status].label}</span>
        </div>
      ))}
    </main>
  );
}