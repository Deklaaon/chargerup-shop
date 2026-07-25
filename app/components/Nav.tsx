"use client";
import Link from "next/link";
import { useAuth } from "../../lib/AuthProvider";

export default function Nav() {
  const { user, profile, signOut, loading } = useAuth();

  return (
    <header style={{ borderBottom: "1px solid #2A2154", position: "sticky", top: 0, background: "#150E2Eee", backdropFilter: "blur(8px)", zIndex: 20 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" className="display-font" style={{ fontWeight: 700, fontSize: 18, color: "#F5F2FF", textDecoration: "none" }}>
          CHARGE<span style={{ color: "#FF3D8A" }}>UP</span>
        </Link>

        <nav style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
          <Link href="/track" style={{ color: "#A79FC7", textDecoration: "none", padding: "8px 12px" }}>ตรวจสอบออเดอร์</Link>

          {!loading && !user && (
            <Link href="/login" style={{ background: "#FF3D8A22", color: "#FF3D8A", padding: "8px 14px", borderRadius: 8, textDecoration: "none" }}>
              เข้าสู่ระบบ
            </Link>
          )}

          {!loading && user && profile && (
            <>
              <Link href="/account" style={{ color: "#29E7CD", textDecoration: "none", padding: "8px 12px" }}>
                {profile.username} · ฿{profile.wallet.toLocaleString()}
              </Link>
              {profile.is_admin && (
                <Link href="/admin" style={{ color: "#8C6CFF", textDecoration: "none", padding: "8px 12px" }}>หลังบ้าน</Link>
              )}
              <button onClick={signOut} style={{ background: "transparent", border: "none", color: "#FF5A6E", cursor: "pointer", padding: "8px 12px" }}>
                ออกจากระบบ
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}