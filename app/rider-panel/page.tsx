import { redirect } from "next/navigation";
import { getPanelSession, panelRoute } from "../panel-auth";
import RiderConsole from "./rider-console";
import "./rider-panel.css";
import "./rider-status.css";
import "./wallet-withdrawal.css";
import "../panel-enhancements.css";

export const dynamic="force-dynamic";
export default async function RiderPanel(){const session=await getPanelSession("RIDER");if(!session)redirect("/panel-login");if(session.role!=="RIDER")redirect(panelRoute(session));return <RiderConsole/>}
