import { redirect } from "next/navigation";
import OwnerConsole from "./owner-console";
import "./owner-console.css";
import { getPanelSession, isOwnerUsername } from "../panel-auth";

export const dynamic = "force-dynamic";

export default async function OwnerPanelPage() {
  const session = await getPanelSession("SUPER_ADMIN");
  if (!session || session.role !== "SUPER_ADMIN" || !isOwnerUsername(session.username))
    redirect("/panel-login");

  return <OwnerConsole owner={session.displayName || "SABKA DELIVERY Owner"} />;
}
