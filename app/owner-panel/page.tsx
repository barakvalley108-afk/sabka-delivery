import { redirect } from "next/navigation";
import AdminConsole from "../super-admin/admin-console";
import "../super-admin/super-admin.css";
import "../super-admin/withdrawals.css";
import "../panel-enhancements.css";
import "./owner-panel.css";
import { getPanelSession, isOwnerUsername } from "../panel-auth";

export const dynamic = "force-dynamic";

export default async function OwnerPanelPage() {
  const session = await getPanelSession("SUPER_ADMIN");
  if (!session || session.role !== "SUPER_ADMIN" || !isOwnerUsername(session.username))
    redirect("/panel-login");

  return (
    <main className="owner-shell">
      <section className="owner-hero">
        <div>
          <span className="owner-eyebrow">SABKA DELIVERY · EXECUTIVE CONTROL</span>
          <h1>Owner Command Center</h1>
          <p>Business, finance, security aur complete platform control — ek dedicated owner experience mein.</p>
        </div>
        <div className="owner-identity">
          <strong>OWNER ACCESS</strong>
          <span>{session.username}</span>
          <a href="/super-admin/security">🔐 Security Center</a>
        </div>
      </section>

      <section className="owner-control-grid" aria-label="Owner controls">
        <a href="/super-admin" className="owner-control-card owner-control-primary">
          <span>⚡</span><div><b>Live Operations</b><small>Orders, shops, riders & catalog</small></div><em>Open →</em>
        </a>
        <a href="/super-admin/security" className="owner-control-card">
          <span>🔐</span><div><b>Security & Access</b><small>Panel access and owner security</small></div><em>Manage →</em>
        </a>
        <a href="/super-admin" className="owner-control-card">
          <span>₹</span><div><b>Finance Control</b><small>Sales, delivery fees & withdrawals</small></div><em>Open →</em>
        </a>
        <a href="/super-admin" className="owner-control-card">
          <span>✦</span><div><b>Growth & Website</b><small>Offers, coupons & website editor</small></div><em>Edit →</em>
        </a>
      </section>

      <section className="owner-capabilities">
        <div><b>OWNER POWER</b><span>Full admin access + executive controls</span></div>
        <p>Owner panel admin se alag visual layer hai, lekin existing admin controls ko remove nahi karta. Orders, shops, catalog, categories, offers, coupons, website editor, panel users, riders, withdrawals aur settings sab available rahenge.</p>
      </section>

      <div className="owner-admin-surface">
        <AdminConsole owner="SABKA DELIVERY Owner · EXECUTIVE" />
      </div>
    </main>
  );
}
