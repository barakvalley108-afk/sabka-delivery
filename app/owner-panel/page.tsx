import AdminConsole from "../super-admin/admin-console";
import "../super-admin/super-admin.css";
import "../super-admin/withdrawals.css";
import "../panel-enhancements.css";

// Dedicated owner entry point. It reuses the existing authenticated admin console
// so owner access stays behind the current private panel authentication.
export const dynamic = "force-static";

export default function OwnerPanelPage() {
  return <AdminConsole owner="SABKA DELIVERY Owner" />;
}
