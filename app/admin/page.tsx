"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthProvider";
import { supabase } from "../../lib/supabaseClient";

type Order = {
  id: string; game_name: string; package_name: string; price: number;
  game_user_id: string; method: string; slip_img: string | null;
  status: string; created_at: string;
};
type Profile = { id: string; username: string; wallet: number; banned: boolean; is_admin: boolean; created_at: string };
type Topup = { id: string; user_id: string; amount: number; slip_img: string; status: string; created_at: string; profiles?: { username: string } };

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "รอตรวจสอบ", color: "#FFC857" },
  paid: { label: "ชำระเงินแล้ว", color: "#29E7CD" },
  completed: { label: "เติมสำเร็จ", color: "#29E7CD" },
  rejected: { label: "ถูกปฏิเสธ", color: "#FF5A6E" },
  approved: { label: "อนุมัติแล้ว", color: "#29E7CD" },
};

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "users">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [viewSlip, setViewSlip] = useState<string | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [userSection, setUserSection] = useState<"accounts" | "requests">("accounts");

  useEffect(() => {
    if (!loading && (!user || (profile && !profile.is_admin))) router.push("/");
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (profile?.is_admin) { loadOrders(); loadUsers(); loadTopups(); }
  }, [profile]);

  const loadOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders((data as Order[]) || []);
  };
  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers((data as Profile[]) || []);
  };
  const loadTopups = async () => {
    const { data } = await supabase.from("wallet_topups").select("*, profiles(username)").order("created_at", { ascending: false });
    setTopups((data as any) || []);
  };

  const updateStatus = async (id: string, status: string) => {
    const order = orders.find((o) => o.id === id);
    if (status === "rejected" && order?.method === "wallet") {
      // no wallet method in this build yet — placeholder for future refund logic
    }
    await supabase.from("orders").update({ status }).eq("id", id);
    loadOrders();
  };

  const toggleBan = async (id: string, banned: boolean) => {
    await supabase.from("profiles").update({ banned: !banned }).eq("id", id);
    loadUsers();
  };

  const adjustWallet = async (u: Profile) => {
    const deltaStr = prompt(`ปรับยอดเงินของ ${u.username} (บวก=เพิ่ม ลบ=หัก) ยอดปัจจุบัน ฿${u.wallet}`, "0");
    const delta = Number(deltaStr);
    if (!delta || isNaN(delta)) return;
    await supabase.from("profiles").update({ wallet: Math.max(0, u.wallet + delta) }).eq("id", u.id);
    loadUsers();
  };

  const decideTopup = async (t: Topup, status: "approved" | "rejected") => {
    if (status === "approved") {
      const u = users.find((x) => x.id === t.user_id);
      if (u) await supabase.from("profiles").update({ wallet: u.wallet + t.amount }).eq("id", u.id);
    }
    await supabase.from("wallet_topups").update({ status }).eq("id", t.id);
    loadUsers();
    loadTopups();
  };

  if (loading || !profile?.is_admin) {
    return <main style={{ padding: 40, color: "#A79FC7" }}>กำลังตรวจสอบสิทธิ์...</main>;
  }

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const pendingTopups = topups.filter((t) => t.status === "pending").length;

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <h1 className="display-font" style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>แผงควบคุมหลังบ้าน</h1>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #2A2154" }}>
        <button onClick={() => setTab("orders")}
          style={{ padding: "10px 16px", fontSize: 14, background: "none", border: "none",
            borderBottom: tab === "orders" ? "2px solid #FF3D8A" : "2px solid transparent",
            color: tab === "orders" ? "#F5F2FF" : "#5C5480" }}>
          ออเดอร์
        </button>
        <button onClick={() => setTab("users")}
          style={{ padding: "10px 16px", fontSize: 14, background: "none", border: "none",
            borderBottom: tab === "users" ? "2px solid #FF3D8A" : "2px solid transparent",
            color: tab === "users" ? "#F5F2FF" : "#5C5480" }}>
          ผู้ใช้งาน {pendingTopups > 0 && <span style={{ background: "#FFC857", color: "#150E2E", borderRadius: 20, fontSize: 10, padding: "1px 6px", marginLeft: 4 }}>{pendingTopups}</span>}
        </button>
      </div>

      {tab === "orders" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["all", "pending", "paid", "completed", "rejected"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12,
                  background: filter === f ? "#FF3D8A22" : "#1F1640",
                  color: filter === f ? "#FF3D8A" : "#A79FC7",
                  border: `1px solid ${filter === f ? "#FF3D8A" : "#2A2154"}` }}>
                {f === "all" ? "ทั้งหมด" : STATUS_LABEL[f].label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map((o) => (
              <div key={o.id} style={{ background: "#1F1640", border: "1px solid #2A2154", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <span className="display-font" style={{ fontWeight: 700 }}>{o.id}</span>
                  <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20,
                    background: `${STATUS_LABEL[o.status].color}22`, color: STATUS_LABEL[o.status].color }}>
                    {STATUS_LABEL[o.status].label}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#A79FC7", marginBottom: 10 }}>
                  {o.game_name} · {o.package_name} · ฿{o.price} · ไอดี: {o.game_user_id} · {o.method === "slip" ? "โอน/สลิป" : "Gateway"}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {o.slip_img && (
                    <button onClick={() => setViewSlip(o.slip_img)}
                      style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#2A2154", color: "#F5F2FF", border: "none" }}>
                      ดูสลิป
                    </button>
                  )}
                  {o.status !== "completed" && (
                    <button onClick={() => updateStatus(o.id, "paid")}
                      style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#29E7CD22", color: "#29E7CD", border: "none" }}>
                      ยืนยันชำระเงิน
                    </button>
                  )}
                  {o.status !== "completed" && (
                    <button onClick={() => updateStatus(o.id, "completed")}
                      style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#8C6CFF22", color: "#8C6CFF", border: "none" }}>
                      เติมสำเร็จแล้ว
                    </button>
                  )}
                  {o.status !== "rejected" && (
                    <button onClick={() => updateStatus(o.id, "rejected")}
                      style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#FF5A6E22", color: "#FF5A6E", border: "none" }}>
                      ปฏิเสธ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "users" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setUserSection("accounts")}
              style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12,
                background: userSection === "accounts" ? "#FF3D8A22" : "#1F1640",
                color: userSection === "accounts" ? "#FF3D8A" : "#A79FC7",
                border: `1px solid ${userSection === "accounts" ? "#FF3D8A" : "#2A2154"}` }}>
              บัญชีผู้ใช้ ({users.length})
            </button>
            <button onClick={() => setUserSection("requests")}
              style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12,
                background: userSection === "requests" ? "#FF3D8A22" : "#1F1640",
                color: userSection === "requests" ? "#FF3D8A" : "#A79FC7",
                border: `1px solid ${userSection === "requests" ? "#FF3D8A" : "#2A2154"}` }}>
              คำขอเติมเงิน {pendingTopups > 0 && `(${pendingTopups})`}
            </button>
          </div>

          {userSection === "accounts" && (
            <div style={{ display: "grid", gap: 10 }}>
              {users.map((u) => (
                <div key={u.id} style={{ background: "#1F1640", border: "1px solid #2A2154", borderRadius: 12, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{u.username} {u.banned && <span style={{ color: "#FF5A6E", fontSize: 12 }}>(ระงับแล้ว)</span>}</p>
                    <p style={{ fontSize: 12, color: "#5C5480" }}>กระเป๋า ฿{u.wallet.toLocaleString()}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => adjustWallet(u)}
                      style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#29E7CD22", color: "#29E7CD", border: "none" }}>
                      ปรับยอด
                    </button>
                    <button onClick={() => toggleBan(u.id, u.banned)}
                      style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: u.banned ? "#29E7CD22" : "#FF5A6E22", color: u.banned ? "#29E7CD" : "#FF5A6E", border: "none" }}>
                      {u.banned ? "ปลดระงับ" : "ระงับบัญชี"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {userSection === "requests" && (
            <div style={{ display: "grid", gap: 10 }}>
              {topups.map((t) => (
                <div key={t.id} style={{ background: "#1F1640", border: "1px solid #2A2154", borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t.profiles?.username ?? "ไม่ทราบชื่อ"}</span>
                    <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 20, background: `${STATUS_LABEL[t.status].color}22`, color: STATUS_LABEL[t.status].color }}>
                      {STATUS_LABEL[t.status].label}
                    </span>
                  </div>
                  <p className="display-font" style={{ fontSize: 18, fontWeight: 700, color: "#29E7CD", marginBottom: 10 }}>฿{t.amount.toLocaleString()}</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href={t.slip_img} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#2A2154", color: "#F5F2FF", textDecoration: "none" }}>
                      ดูสลิป
                    </a>
                    {t.status === "pending" && (
                      <>
                        <button onClick={() => decideTopup(t, "approved")}
                          style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#29E7CD22", color: "#29E7CD", border: "none" }}>
                          อนุมัติ
                        </button>
                        <button onClick={() => decideTopup(t, "rejected")}
                          style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, background: "#FF5A6E22", color: "#FF5A6E", border: "none" }}>
                          ปฏิเสธ
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {viewSlip && (
        <div onClick={() => setViewSlip(null)}
          style={{ position: "fixed", inset: 0, background: "#000000b3", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <img src={viewSlip} alt="slip" style={{ maxHeight: "80vh", borderRadius: 8 }} />
        </div>
      )}
    </main>
  );
}