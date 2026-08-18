import { redirect } from "next/navigation";
import CommissionSlabsPage from "../../super-admin/commission-slabs/page";
import { getPanelSession, isOwnerUsername } from "../../panel-auth";

export const dynamic = "force-dynamic";

export default async function OwnerCommissionSlabsPage() {
  const session = await getPanelSession("SUPER_ADMIN");
  if (!session || !isOwnerUsername(session.username)) redirect("/panel-login");
  return <CommissionSlabsPage />;
}
