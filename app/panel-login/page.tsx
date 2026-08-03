import { redirect } from "next/navigation";
import { getPanelSession, panelRoute } from "../panel-auth";
import LoginForm from "./login-form";
import "./panel-login.css";

export const dynamic = "force-dynamic";

export default async function PanelLogin() {
  const session = await getPanelSession();
  if (session) redirect(panelRoute(session));
  return <LoginForm />;
}
