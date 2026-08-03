import { redirect } from "next/navigation";
import { getPanelSession, panelRoute } from "../panel-auth";
import AdminConsole from "./admin-console";
import "./super-admin.css";
import "./withdrawals.css";
import "../panel-enhancements.css";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const session = await getPanelSession();
  if (!session) redirect("/panel-login");
  if (session.role !== "SUPER_ADMIN") redirect(panelRoute(session));
  return <AdminConsole owner={session.displayName} />;
}
