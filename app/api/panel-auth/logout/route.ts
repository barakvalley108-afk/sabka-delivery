import { cookies } from "next/headers";
import { ensureControlTables } from "../../../../db/control-store";
import {
  PANEL_COOKIE,
  panelCookie,
  sha256,
  type PanelRole,
} from "../../../panel-auth";

export async function GET(request: Request) {
  const jar = await cookies();
  const requestedRole = new URL(request.url).searchParams.get("role");
  const roles = ["SUPER_ADMIN", "RESTAURANT", "RIDER", "STAFF"] as PanelRole[];
  const role = (roles as string[]).includes(requestedRole || "")
    ? (requestedRole as PanelRole)
    : null;
  const cookieNames = role
    ? [panelCookie(role)]
    : [PANEL_COOKIE, ...roles.map(panelCookie)];
  const tokens = cookieNames
    .map((cookieName) => jar.get(cookieName)?.value)
    .filter((token): token is string => !!token);
  if (tokens.length) {
    const db = await ensureControlTables();
    await db.batch(
      await Promise.all(
        tokens.map(async (token) =>
          db
            .prepare("DELETE FROM market_panel_sessions WHERE token_hash=?")
            .bind(await sha256(token)),
        ),
      ),
    );
  }
  for (const cookieName of cookieNames)
    jar.set(cookieName, "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
  return Response.redirect(new URL("/panel-login", request.url), 303);
}
