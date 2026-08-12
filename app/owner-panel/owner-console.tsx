"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./owner-console.css";

type Account = {
  username: string;
  role: string;
  panelType: string;
  displayName: string;
  isActive: number;
  lastLogin: string | null;
};
type Data = {
  accounts: Account[];
  stores: Array<{ id: number; name: string; isOpen: number; vertical: string; blocked: number; approved: number }>;
  riders: Array<{ id: number; name: string; isOnline: number }>;
  orders: Array<{ orderCode: string; total: number; status: string; storeName: string; createdAt: string }>;
  payouts: Array<{ id: number; amount: number; status: string; riderName: string }>;
  notifications: Array<{ id: number; title: string; message: string; isRead: number; createdAt: string }>;
  settings: Record<string, string>;
  summary: { totalOrders: number; totalSales: number; activeOrders: number; openStores: number; onlineRiders: number; activePanels: number };
};

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function OwnerConsole({ owner }: { owner: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<"HQ" | "SECURITY" | "OPERATIONS">("HQ");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState("koron2013");
  const [newPassword, setNewPassword] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/control", { cache: "no-store" });
      if (response.status === 401 || response.status === 403) {
        window.location.href = "/panel-login";
        return;
      }
      const result = (await response.json()) as Data & { error?: string };
      if (!response.ok) throw new Error(result.error || "Owner data load failed");
      setData(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Owner data load failed");
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 8000);
    return () => window.clearInterval(timer);
  }, [load]);

  const callOwner = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/owner/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { error?: string; requiresLogin?: boolean };
      if (!response.ok) throw new Error(result.error || "Owner action failed");
      setSuccess("Owner control updated successfully");
      setNewPassword("");
      await load();
      if (result.requiresLogin) window.setTimeout(() => (window.location.href = "/panel-login"), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Owner action failed");
    } finally {
      setBusy(false);
    }
  };

  const admins = useMemo(() => (data?.accounts || []).filter((account) => account.role === "SUPER_ADMIN"), [data]);
  const activeStores = data?.stores.filter((store) => store.isOpen && !store.blocked).length || 0;
  const pendingPayouts = data?.payouts.filter((payout) => payout.status === "PENDING").length || 0;

  if (!data) {
    return <main className="owner-loading"><img src="/images/sabka-delivery-logo.png" alt="" /><h1>Owner HQ loading…</h1><p>{error || "Secure control room connect ho raha hai"}</p></main>;
  }

  return (
    <main className="owner-shell">
      <aside className="owner-sidebar">
        <a className="owner-brand" href="/owner-panel"><img src="/images/sabka-delivery-logo.png" alt="" /><span>SABKA DELIVERY<strong>OWNER HQ</strong></span></a>
        <div className="owner-badge">FULL BUSINESS CONTROL</div>
        <nav>
          <button className={tab === "HQ" ? "active" : ""} onClick={() => setTab("HQ")}>⌂ Command Center</button>
          <button className={tab === "OPERATIONS" ? "active" : ""} onClick={() => setTab("OPERATIONS")}>⚡ Operations</button>
          <button className={tab === "SECURITY" ? "active" : ""} onClick={() => setTab("SECURITY")}>🔐 Owner Security</button>
        </nav>
        <div className="owner-links">
          <a href="/super-admin">Open Full Admin Control Room ↗</a>
          <a href="/" target="_blank">Customer Website ↗</a>
          <a href="/about">About Us ↗</a>
        </div>
        <div className="owner-profile"><span>{owner.slice(0, 1)}</span><div><b>{owner}</b><small>Owner · Super Admin</small></div><a href="/api/panel-auth/logout">Sign out</a></div>
      </aside>

      <section className="owner-main">
        <header className="owner-topbar">
          <div><small>SABKA DELIVERY · LALA BAZAR</small><h1>{tab === "HQ" ? "Owner Command Center" : tab === "OPERATIONS" ? "Business Operations" : "Owner Security"}</h1></div>
          <div className="owner-top-actions"><span className="live-dot">LIVE</span><button onClick={() => void load()}>↻ Refresh</button></div>
        </header>

        {error && <div className="owner-alert error">{error}</div>}
        {success && <div className="owner-alert success">✓ {success}</div>}

        {tab === "HQ" && (
          <>
            <section className="owner-metrics">
              <article className="gold"><small>Today Sales</small><strong>{money(data.summary.totalSales)}</strong><span>Delivered orders only</span></article>
              <article><small>Orders Today</small><strong>{data.summary.totalOrders}</strong><span>{data.summary.activeOrders} active now</span></article>
              <article><small>Open Shops</small><strong>{activeStores}</strong><span>{data.stores.length} total shops</span></article>
              <article><small>Riders Online</small><strong>{data.summary.onlineRiders}</strong><span>{data.riders.length} riders</span></article>
              <article><small>Pending Payouts</small><strong>{pendingPayouts}</strong><span>Requires owner attention</span></article>
              <article><small>Active Panel Sessions</small><strong>{data.summary.activePanels}</strong><span>Live private access</span></article>
            </section>

            <section className="owner-grid-two">
              <article className="owner-card emphasis"><header><div><small>OWNER ADVANTAGE</small><h2>Admin se upar direct controls</h2></div></header><div className="owner-feature-list"><div><b>🔐 Security</b><span>Super Admin passwords, status aur sessions control karo.</span></div><div><b>⚙ Operations</b><span>Maintenance mode, live monitoring aur critical operations.</span></div><div><b>📊 Business</b><span>Sales, orders, shops, riders aur payouts ek screen par.</span></div><div><b>🛠 Full Admin</b><span>Existing Control Room ki complete powers bhi available.</span></div></div><a className="owner-primary" href="/super-admin">Open Full Admin Control Room</a></article>

              <article className="owner-card"><header><div><small>RECENT ORDERS</small><h2>Live business pulse</h2></div></header>{data.orders.slice(0, 7).map((order) => <div className="owner-order" key={order.orderCode}><span className={`owner-status ${order.status.toLowerCase()}`}>{order.status.replaceAll("_", " ")}</span><p><b>{order.storeName}</b><small>{order.orderCode}</small></p><strong>{money(order.total)}</strong></div>)}{!data.orders.length && <p className="owner-muted">No orders yet.</p>}</article>
            </section>
          </>
        )}

        {tab === "OPERATIONS" && (
          <section className="owner-grid-two">
            <article className="owner-card"><header><div><small>GLOBAL BUSINESS SWITCH</small><h2>Maintenance mode</h2></div><span className={data.settings.maintenance_mode === "true" ? "pill danger" : "pill safe"}>{data.settings.maintenance_mode === "true" ? "ON" : "OFF"}</span></header><p className="owner-muted">Owner can immediately stop customer ordering without changing the admin console.</p><button className="owner-primary" disabled={busy} onClick={() => void callOwner({ action: "setMaintenance", enabled: data.settings.maintenance_mode !== "true" })}>{data.settings.maintenance_mode === "true" ? "Turn maintenance OFF" : "Turn maintenance ON"}</button></article>
            <article className="owner-card"><header><div><small>CRITICAL ACCESS</small><h2>Private control rooms</h2></div></header><div className="control-links"><a href="/super-admin">Orders & payments ↗</a><a href="/super-admin">Shops & catalog ↗</a><a href="/super-admin">Riders & withdrawals ↗</a><a href="/super-admin">Website editor ↗</a><a href="/super-admin">Panel users ↗</a><a href="/super-admin">Settings ↗</a></div></article>
          </section>
        )}

        {tab === "SECURITY" && (
          <section className="owner-grid-two">
            <article className="owner-card"><header><div><small>SUPER ADMIN ACCOUNTS</small><h2>Admin power management</h2></div></header>{admins.map((account) => <div className="security-account" key={account.username}><div><b>{account.username}</b><small>{account.displayName} · {account.isActive ? "Active" : "Disabled"}</small></div><span className={account.isActive ? "pill safe" : "pill danger"}>{account.isActive ? "ACTIVE" : "OFF"}</span><button disabled={busy || account.username === "dhoni1981"} onClick={() => void callOwner({ action: "setSuperAdminActive", username: account.username, isActive: !account.isActive })}>{account.isActive ? "Disable" : "Enable"}</button><button disabled={busy} onClick={() => void callOwner({ action: "revokeSuperAdminSessions", username: account.username })}>Revoke sessions</button></div>)}</article>
            <article className="owner-card"><header><div><small>CHANGE PASSWORD</small><h2>Reset any Super Admin</h2></div></header><label className="owner-field">Target account<select value={selectedAdmin} onChange={(event) => setSelectedAdmin(event.target.value)}>{admins.map((account) => <option key={account.username} value={account.username}>{account.username} · {account.displayName}</option>)}</select></label><label className="owner-field">New password<input type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Minimum 8 characters" /></label><button className="owner-primary" disabled={busy || newPassword.length < 8} onClick={() => void callOwner({ action: "changeSuperAdminPassword", username: selectedAdmin, password: newPassword })}>Change Admin Password</button><p className="owner-muted">Password change immediately invalidates that account's existing sessions.</p></article>
          </section>
        )}
      </section>
    </main>
  );
}
