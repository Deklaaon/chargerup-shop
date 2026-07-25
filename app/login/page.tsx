"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthProvider";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const submit = async () => {
    setErr("");
    if (!email || !password) { setErr("กรอกอีเมลและรหัสผ่านให้ครบ"); return; }
    if (mode === "register" && username.trim().length < 3) { setErr("ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร"); return; }

    setBusy(true);
    const error = mode === "login"
      ? await signIn(email, password)
      : await signUp(email, password, username.trim());
    setBusy(false);

    if (error) { setErr(error); return; }
    router.push("/");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 360, background: "#1F1640", border: "1px solid #2A2154", borderRadius: 16, padding: 24 }}>
        <h1 className="display-font" style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          {mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </h1>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button onClick={() => setMode("login")} style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: mode === "login" ? "#FF3D8A22" : "#150E2E", border: `1px solid ${mode === "login" ? "#FF3D8A" : "#2A2154"}`, color: mode === "login" ? "#FF3D8A" : "#A79FC7" }}>
            เข้าสู่ระบบ
          </button>
          <button onClick={() => setMode("register")} style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: mode === "register" ? "#8C6CFF22" : "#150E2E", border: `1px solid ${mode === "register" ? "#8C6CFF" : "#2A2154"}`, color: mode === "register" ? "#8C6CFF" : "#A79FC7" }}>
            สมัครสมาชิก
          </button>
        </div>

        {mode === "register" && (
          <>
            <label style={{ fontSize: 12, color: "#A79FC7" }}>ชื่อผู้ใช้</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="เช่น player123"
              style={{ width: "100%", padding: "10px 12px", marginTop: 6, marginBottom: 12, borderRadius: 8, background: "#150E2E", border: "1px solid #2A2154", color: "#F5F2FF" }} />
          </>
        )}

        <label style={{ fontSize: 12, color: "#A79FC7" }}>อีเมล</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
          style={{ width: "100%", padding: "10px 12px", marginTop: 6, marginBottom: 12, borderRadius: 8, background: "#150E2E", border: "1px solid #2A2154", color: "#F5F2FF" }} />

        <label style={{ fontSize: 12, color: "#A79FC7" }}>รหัสผ่าน</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร"
          style={{ width: "100%", padding: "10px 12px", marginTop: 6, marginBottom: 16, borderRadius: 8, background: "#150E2E", border: "1px solid #2A2154", color: "#F5F2FF" }} />

        {err && <p style={{ color: "#FF5A6E", fontSize: 13, marginBottom: 12 }}>{err}</p>}

        <button disabled={busy} onClick={submit}
          style={{ width: "100%", padding: "12px 0", borderRadius: 10, fontWeight: 600, background: mode === "login" ? "#FF3D8A" : "#8C6CFF", color: "#150E2E", border: "none" }}>
          {busy ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}
        </button>
      </div>
    </div>
  );
}