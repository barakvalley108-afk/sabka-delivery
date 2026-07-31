"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: number; mobile: string; name: string | null; photoData?: string };
type Address = { recipientName?: string; mobile?: string; address?: string; landmark?: string; area?: string; pincode?: string };

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [name, setName] = useState("");
  const [photoData, setPhotoData] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [landmark, setLandmark] = useState("");
  const [area, setArea] = useState("Lala Bazar");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [activeEditor, setActiveEditor] = useState<"profile" | "address" | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/customer-profile", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/customer-address", { cache: "no-store" }).then((response) => response.json()),
    ])
      .then(([profileData, addressData]) => {
        if (!profileData.user) {
          window.location.replace("/customer-access?next=/profile");
          return;
        }
        setUser(profileData.user);
        setName(profileData.user.name || "");
        setPhotoData(profileData.user.photoData || "");
        const saved = addressData.address || null;
        setAddress(saved);
        setRecipientName(saved?.recipientName || profileData.user.name || "");
        setAddressLine(saved?.address || "");
        setLandmark(saved?.landmark || "");
        setArea(saved?.area || "Lala Bazar");
      })
      .catch(() => setMessage("Profile load nahi hua. Dobara try karo."))
      .finally(() => setLoading(false));
  }, []);

  function pickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/image\/(jpeg|png|webp)/i.test(file.type)) {
      setMessage("Sirf JPG, PNG ya WEBP photo choose karo.");
      return;
    }
    if (file.size > 350 * 1024) {
      setMessage("Photo 350 KB se chhoti honi chahiye.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoData(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setMessage("");
    try {
      const response = await fetch("/api/customer-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, photoData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Profile update nahi hua");
      setUser(data.user);
      setRecipientName((current) => current || data.user.name || "");
      setMessage("Profile successfully update ho gaya.");
      setActiveEditor(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile update nahi hua");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveAddress(event: FormEvent) {
    event.preventDefault();
    setSavingAddress(true);
    setMessage("");
    try {
      const response = await fetch("/api/customer-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientName, address: addressLine, landmark, area }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Address save nahi hua");
      setAddress(data.address);
      setMessage("Saved address successfully update ho gaya.");
      setActiveEditor(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Address save nahi hua");
    } finally {
      setSavingAddress(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    try { await fetch("/api/customer-logout", { method: "POST" }); }
    finally { window.location.replace("/customer-access"); }
  }

  return (
    <main className="profile-page">
      <header>
        <button onClick={() => router.push("/")}>←</button>
        <div><small>MY ACCOUNT</small><h1>Profile</h1></div>
      </header>

      <section className="profile-card hero-card">
        <div className="avatar">
          {photoData ? <img src={photoData} alt="Profile" /> : (user?.name?.trim()?.charAt(0).toUpperCase() || "U")}
        </div>
        <div>
          <h2>{loading ? "Loading..." : user?.name || "Sabka Delivery Customer"}</h2>
          <p>+91 {user?.mobile || ""}</p>
        </div>
      </section>

      {message && <p className="message">{message}</p>}

      <section className="profile-card actions">
        <button onClick={() => router.push("/orders")}><span>▤</span><div><b>My Orders</b><small>Saare orders automatically saved</small></div><i>›</i></button>
        <button onClick={() => setActiveEditor(activeEditor === "address" ? null : "address")}><span>📍</span><div><b>Saved Address</b><small>{address?.address || "Delivery address add karo"}</small></div><i>›</i></button>
        <button onClick={() => setActiveEditor(activeEditor === "profile" ? null : "profile")}><span>✎</span><div><b>Edit Profile</b><small>Name aur optional photo update karo</small></div><i>›</i></button>
      </section>

      {activeEditor === "profile" && (
        <form className="profile-card editor" onSubmit={saveProfile}>
          <h3>Edit Profile</h3>
          <label>
            <span>Profile photo <small>(optional)</small></span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickPhoto} />
          </label>
          {photoData && <button type="button" className="remove-photo" onClick={() => setPhotoData("")}>Remove photo</button>}
          <label><span>Name</span><input value={name} onChange={(event) => setName(event.target.value.slice(0, 80))} minLength={2} required /></label>
          <label><span>Mobile number</span><input value={user?.mobile || ""} disabled /></label>
          <button className="save" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Profile"}</button>
        </form>
      )}

      {activeEditor === "address" && (
        <form className="profile-card editor" onSubmit={saveAddress}>
          <h3>Saved Address</h3>
          <label><span>Recipient name</span><input value={recipientName} onChange={(event) => setRecipientName(event.target.value.slice(0, 80))} minLength={2} required /></label>
          <label><span>Full address</span><textarea value={addressLine} onChange={(event) => setAddressLine(event.target.value.slice(0, 500))} minLength={8} required placeholder="House, road, village, landmark" /></label>
          <label><span>Landmark <small>(optional)</small></span><input value={landmark} onChange={(event) => setLandmark(event.target.value.slice(0, 150))} /></label>
          <label><span>Area</span><input value={area} onChange={(event) => setArea(event.target.value.slice(0, 100))} required /></label>
          <label><span>Pincode</span><input value={address?.pincode || "Signup pincode"} disabled /></label>
          <button className="save" disabled={savingAddress}>{savingAddress ? "Saving..." : "Save Address"}</button>
        </form>
      )}

      <button className="logout" onClick={logout} disabled={loggingOut}>{loggingOut ? "Logging out..." : "Log out"}</button>

      <style jsx>{`
        :global(body){margin:0;background:#fff9ef;color:#241413;font-family:Arial,sans-serif}
        .profile-page{min-height:100vh;padding:18px 16px 104px;max-width:720px;margin:auto}
        header{display:grid;grid-template-columns:44px 1fr;align-items:center;gap:10px;margin-bottom:18px}header button{width:44px;height:44px;border:0;border-radius:14px;background:white;box-shadow:0 5px 18px #5b302018;font-size:20px}header small{color:#c7181b;font-weight:800;letter-spacing:.12em}h1{margin:3px 0 0;font-size:28px}
        .profile-card{background:white;border:1px solid #f0ddd1;border-radius:20px;padding:18px;box-shadow:0 8px 28px #63351f12;margin-bottom:14px}.hero-card{display:flex;align-items:center;gap:15px;background:linear-gradient(135deg,#fff,#fff1d6)}.avatar{width:68px;height:68px;border-radius:22px;background:#c7181b;color:white;display:grid;place-items:center;font-size:30px;font-weight:900;overflow:hidden}.avatar img{width:100%;height:100%;object-fit:cover}.hero-card h2{margin:0 0 5px}.hero-card p{margin:0;color:#775d55}
        .actions{padding:5px 16px}.actions button{width:100%;border:0;background:transparent;display:grid;grid-template-columns:42px 1fr auto;align-items:center;text-align:left;gap:10px;padding:15px 0;border-bottom:1px solid #f2e7e0}.actions button:last-child{border-bottom:0}.actions span{font-size:22px}.actions div{display:grid;gap:4px}.actions small{color:#80675f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:480px}.actions i{font-size:24px;color:#a58f87;font-style:normal}
        .editor{display:grid;gap:14px}.editor h3{margin:0}.editor label{display:grid;gap:7px}.editor label>span{font-weight:800;font-size:13px}.editor label small{font-weight:400;color:#80675f}.editor input,.editor textarea{width:100%;box-sizing:border-box;border:1.5px solid #e7d8cf;border-radius:13px;padding:13px;font:inherit;background:#fff;color:#241413}.editor textarea{min-height:100px;resize:vertical}.editor input:disabled{background:#f6f2ef;color:#8c7770}.save{border:0;border-radius:14px;padding:14px;background:#c7181b;color:white;font-weight:900;font-size:15px}.remove-photo{justify-self:start;border:1px solid #e6b5b5;background:#fff;color:#b2181c;border-radius:10px;padding:8px 11px;font-weight:800}
        .message{background:#fff;border:1px solid #f0ddd1;border-radius:13px;padding:12px;color:#6b4d44;font-weight:700}.logout{width:100%;border:1px solid #e9b8b8;background:white;color:#b2181c;border-radius:15px;padding:14px;font-weight:900;font-size:15px}.logout:disabled,.save:disabled{opacity:.6}
        @media(max-width:520px){.actions small{max-width:220px}.profile-page{padding-left:12px;padding-right:12px}.profile-card{border-radius:17px}}
      `}</style>
    </main>
  );
}
