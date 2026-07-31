"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: number; mobile: string; name: string | null };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!data.user) {
          window.location.replace("/customer-access?next=/profile");
          return;
        }
        setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/customer-logout", { method: "POST" });
    } finally {
      window.location.replace("/customer-access");
    }
  }

  return (
    <main className="profile-page">
      <header>
        <button onClick={() => router.push("/")}>←</button>
        <div><small>MY ACCOUNT</small><h1>Profile</h1></div>
      </header>

      <section className="profile-card hero-card">
        <div className="avatar">{user?.name?.trim()?.charAt(0).toUpperCase() || "U"}</div>
        <div>
          <h2>{loading ? "Loading..." : user?.name || "Sabka Delivery Customer"}</h2>
          <p>+91 {user?.mobile || ""}</p>
        </div>
      </section>

      <section className="profile-card actions">
        <button onClick={() => router.push("/orders")}><span>▤</span><div><b>My Orders</b><small>Saare orders automatically saved</small></div><i>›</i></button>
        <button onClick={() => alert("Saved address aur edit profile next update me yahin available hoga.")}><span>📍</span><div><b>Saved Address</b><small>Delivery address manage karo</small></div><i>›</i></button>
        <button onClick={() => alert("Profile edit option next update me add hoga.")}><span>✎</span><div><b>Edit Profile</b><small>Name aur details update karo</small></div><i>›</i></button>
      </section>

      <button className="logout" onClick={logout} disabled={loggingOut}>{loggingOut ? "Logging out..." : "Log out"}</button>

      <style jsx>{`
        :global(body){margin:0;background:#fff9ef;color:#241413;font-family:Arial,sans-serif}
        .profile-page{min-height:100vh;padding:18px 16px 104px;max-width:720px;margin:auto}
        header{display:grid;grid-template-columns:44px 1fr;align-items:center;gap:10px;margin-bottom:18px}header button{width:44px;height:44px;border:0;border-radius:14px;background:white;box-shadow:0 5px 18px #5b302018;font-size:20px}header small{color:#c7181b;font-weight:800;letter-spacing:.12em}h1{margin:3px 0 0;font-size:28px}
        .profile-card{background:white;border:1px solid #f0ddd1;border-radius:20px;padding:18px;box-shadow:0 8px 28px #63351f12;margin-bottom:14px}.hero-card{display:flex;align-items:center;gap:15px;background:linear-gradient(135deg,#fff,#fff1d6)}.avatar{width:68px;height:68px;border-radius:22px;background:#c7181b;color:white;display:grid;place-items:center;font-size:30px;font-weight:900}.hero-card h2{margin:0 0 5px}.hero-card p{margin:0;color:#775d55}
        .actions{padding:5px 16px}.actions button{width:100%;border:0;background:transparent;display:grid;grid-template-columns:42px 1fr auto;align-items:center;text-align:left;gap:10px;padding:15px 0;border-bottom:1px solid #f2e7e0}.actions button:last-child{border-bottom:0}.actions span{font-size:22px}.actions div{display:grid;gap:4px}.actions small{color:#80675f}.actions i{font-size:24px;color:#a58f87;font-style:normal}
        .logout{width:100%;border:1px solid #e9b8b8;background:white;color:#b2181c;border-radius:15px;padding:14px;font-weight:900;font-size:15px}.logout:disabled{opacity:.6}
      `}</style>
    </main>
  );
}
