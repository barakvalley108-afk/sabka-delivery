import { redirect } from "next/navigation";
import { getPanelSession } from "../panel-auth";
import AdminConsole from "./admin-console";
import CustomerPinManager from "./customer-pin-manager";
import GroceryExpiryField from "./grocery-expiry-field";
import RetryButtonFix from "./retry-button-fix";
import RetailMartImporter from "./retail-mart-importer";
import "./super-admin.css";
import "./withdrawals.css";
import "../panel-enhancements.css";
import "./sidebar-user-fix.css";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const session = await getPanelSession("SUPER_ADMIN");
  if (!session) redirect("/panel-login");
  if (session.role !== "SUPER_ADMIN") redirect("/");

  return (
    <>
      <AdminConsole owner={session.displayName} />
      <CustomerPinManager />
      <GroceryExpiryField />
      <RetryButtonFix />
      <RetailMartImporter />
    </>
  );
}
