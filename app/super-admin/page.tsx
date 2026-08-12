import AdminConsole from "./admin-console";
import "./super-admin.css";
import "./withdrawals.css";
import "../panel-enhancements.css";

// Keep the page itself static. Authentication and role validation are handled
// by /api/admin/control before any private data is returned. This avoids a
// server-rendered D1/session lookup on every /super-admin refresh, which was
// intermittently exceeding the Cloudflare Worker CPU limit.
export const dynamic = "force-static";

export default function SuperAdminPage() {
  return (
    <>
      <div className="owner-security-shortcut">
        <a href="/super-admin/security">🔐 Owner Security · Change Admin Password</a>
      </div>
      <AdminConsole owner="SABKA DELIVERY Owner" />
    </>
  );
}
