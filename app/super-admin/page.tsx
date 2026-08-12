import { redirect } from "next/navigation";
import AdminConsole from "./admin-console";
import "./super-admin.css";
import "./withdrawals.css";
import "../panel-enhancements.css";
import { getPanelSession, isOwnerUsername } from "../panel-auth";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const session = await getPanelSession("SUPER_ADMIN");
  if (!session) redirect("/panel-login");
  if (session.role !== "SUPER_ADMIN" || isOwnerUsername(session.username))
    redirect("/panel-login");

  return (
    <AdminConsole owner={session.displayName || "KORON SUPER ADMIN"} />
  );
}
