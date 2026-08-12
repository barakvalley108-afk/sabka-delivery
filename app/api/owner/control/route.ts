import { ensureControlTables } from "../../../../db/control-store";
import {
  getPanelSession,
  isOwnerUsername,
  isSuperAdminUsername,
  passwordHash,
} from "../../../panel-auth";

async function ownerSession() {
  const session = await getPanelSession("SUPER_ADMIN");
  return session && isOwnerUsername(session.username) ? session : null;
}

export async function GET() {
  const session = await ownerSession();
  if (!session) return Response.json({ error: "Owner access required" }, { status: 403 });
  return Response.json({ ok: true, owner: session.username });
}

export async function POST(request: Request) {
  const session = await ownerSession();
  if (!session) return Response.json({ error: "Owner access required" }, { status: 403 });

  const body = (await request.json()) as Record<string, unknown>;
  const action = String(body.action || "");
  const db = await ensureControlTables();

  if (action === "changeSuperAdminPassword") {
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!isSuperAdminUsername(username) || password.length < 8)
      return Response.json({ error: "Valid Super Admin aur 8+ character password required" }, { status: 400 });
    await db
      .prepare("UPDATE market_panel_accounts SET password_hash=?,is_active=1 WHERE username=? AND role='SUPER_ADMIN'")
      .bind(await passwordHash(password), username)
      .run();
    await db.prepare("DELETE FROM market_panel_sessions WHERE username=?").bind(username).run();
    await db
      .prepare("INSERT INTO market_admin_activity (username,action,target,details) VALUES (?,?,?,?)")
      .bind(session.username, "OWNER_PASSWORD_CHANGE", username, "Super Admin password changed by owner")
      .run();
    return Response.json({ ok: true, requiresLogin: username === session.username });
  }

  if (action === "setSuperAdminActive") {
    const username = String(body.username || "").trim().toLowerCase();
    const isActive = body.isActive ? 1 : 0;
    if (!isSuperAdminUsername(username))
      return Response.json({ error: "Valid Super Admin required" }, { status: 400 });
    if (username === session.username && !isActive)
      return Response.json({ error: "Owner account ko disable nahi kar sakte" }, { status: 409 });
    await db
      .prepare("UPDATE market_panel_accounts SET is_active=? WHERE username=? AND role='SUPER_ADMIN'")
      .bind(isActive, username)
      .run();
    if (!isActive) await db.prepare("DELETE FROM market_panel_sessions WHERE username=?").bind(username).run();
    await db
      .prepare("INSERT INTO market_admin_activity (username,action,target,details) VALUES (?,?,?,?)")
      .bind(session.username, "OWNER_ACCOUNT_STATUS", username, isActive ? "Super Admin enabled" : "Super Admin disabled")
      .run();
    return Response.json({ ok: true });
  }

  if (action === "revokeSuperAdminSessions") {
    const username = String(body.username || "").trim().toLowerCase();
    if (!isSuperAdminUsername(username))
      return Response.json({ error: "Valid Super Admin required" }, { status: 400 });
    await db.prepare("DELETE FROM market_panel_sessions WHERE username=?").bind(username).run();
    await db
      .prepare("INSERT INTO market_admin_activity (username,action,target,details) VALUES (?,?,?,?)")
      .bind(session.username, "OWNER_REVOKE_SESSIONS", username, "All sessions revoked by owner")
      .run();
    return Response.json({ ok: true, requiresLogin: username === session.username });
  }

  if (action === "setMaintenance") {
    const enabled = body.enabled ? "true" : "false";
    await db
      .prepare("INSERT INTO market_settings (key,value,updated_at) VALUES ('maintenance_mode',?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP")
      .bind(enabled)
      .run();
    await db
      .prepare("INSERT INTO market_admin_activity (username,action,target,details) VALUES (?,?,?,?)")
      .bind(session.username, "OWNER_MAINTENANCE", "maintenance_mode", enabled)
      .run();
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown owner action" }, { status: 400 });
}
