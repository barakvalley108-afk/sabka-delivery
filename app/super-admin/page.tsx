import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminConsole from "./admin-console";
import "./super-admin.css";
import "./withdrawals.css";
import "../panel-enhancements.css";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const jar = await cookies();
  const hasSession = Boolean(
    jar.get("sabka_admin_session")?.value ||
      jar.get("sabka_panel_session")?.value,
  );

  if (!hasSession) redirect("/panel-login");

  // The Admin API performs the authoritative role/session check. Keeping the
  // initial page render cookie-only avoids an extra D1 query on every refresh,
  // which can otherwise push Cloudflare Workers over the CPU limit.
  return <AdminConsole owner="SABKA DELIVERY Owner" />;
}
