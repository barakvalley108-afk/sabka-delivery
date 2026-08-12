import { redirect } from "next/navigation";
import AdminConsole from "../super-admin/admin-console";
import "../super-admin/super-admin.css";
import "../super-admin/withdrawals.css";
import "../panel-enhancements.css";
import { getPanelSession, isOwnerUsername } from "../panel-auth";

export const dynamic = "force-dynamic";

export default async function OwnerPanelPage() {
  const session = await getPanelSession("SUPER_ADMIN");
  if (!session || session.role !== "SUPER_ADMIN" || !isOwnerUsername(session.username))
    redirect("/panel-login");

  // Owner gets the complete, same fast admin control surface instead of a
  // separate limited dashboard. This keeps every existing editor and business
  // control in one place: orders, shops, catalog, sections, categories,
  // offers, coupons, website editor, panel users, riders, withdrawals, settings.
  return (
    <>
      <div className="owner-security-shortcut">
        <span>OWNER · FULL CONTROL</span>
        <a href="/super-admin/security">🔐 Owner Security</a>
      </div>
      <AdminConsole owner="SABKA DELIVERY Owner · FULL CONTROL" />
    </>
  );
}
