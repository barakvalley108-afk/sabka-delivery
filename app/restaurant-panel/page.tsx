import { redirect } from "next/navigation";
import { getPanelSession, panelRoute } from "../panel-auth";
import PartnerConsole from "../partner-panel/partner-console";
import "../partner-panel/partner-panel.css";
import "../panel-enhancements.css";

export const dynamic="force-dynamic";
export default async function RestaurantPanel(){const session=await getPanelSession("RESTAURANT");if(!session)redirect("/panel-login");if(session.role!=="RESTAURANT"||session.panelType!=="RESTAURANT")redirect(panelRoute(session));return <PartnerConsole expected="RESTAURANT"/>}
