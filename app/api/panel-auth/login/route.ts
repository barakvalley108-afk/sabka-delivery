import { cookies } from "next/headers";
import { ensureControlTables } from "../../../../db/control-store";
import {
  isSuperAdminUsername,
  panelCookie,
  panelRoute,
  passwordHash,
  requestMeta,
  sha256,
  type PanelRole,
  type PanelType,
} from "../../../panel-auth";

const KORON_ADMIN_USERNAME = "koron2013";
const KORON_ADMIN_PASSWORD_HASH = "dca84a340d2dbd50d4c246b26e8a5075b7d65cf412b1122ff2940ceb796a4b05";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";
  if (!username || !password)
    return Response.json({ error: "User ID aur password required hai" }, { status: 400 });

  const db = await ensureControlTables();

  let account = await db
    .prepare(
      `SELECT username,password_hash passwordHash,role,panel_type panelType,is_active isActive,display_name displayName
       FROM market_panel_accounts WHERE lower(username)=?`,
    )
    .bind(username)
    .first<{
      username: string;
      passwordHash: string;
      role: PanelRole;
      panelType: PanelType;
      isActive: number;
      displayName: string;
    }>();

  // Repair/bootstrap the koron2013 Super Admin account on successful credential use.
  if (
    username === KORON_ADMIN_USERNAME &&
    (await passwordHash(password)) === KORON_ADMIN_PASSWORD_HASH
  ) {
    if (!account) {
      await db
        .prepare(
          `INSERT INTO market_panel_accounts
           (username,password_hash,role,panel_type,display_name,permissions,is_active)
           VALUES (?,?,?,?,?,?,1)`,
        )
        .bind(
          KORON_ADMIN_USERNAME,
          KORON_ADMIN_PASSWORD_HASH,
          "SUPER_ADMIN",
          "SUPER_ADMIN",
          "Prem Super Admin",
          '["ALL"]',
        )
        .run();
    } else if (
      account.role !== "SUPER_ADMIN" ||
      account.passwordHash !== KORON_ADMIN_PASSWORD_HASH ||
      account.isActive !== 1 ||
      account.displayName !== "Prem Super Admin"
    ) {
      await db
        .prepare(
          `UPDATE market_panel_accounts
           SET password_hash=?,role='SUPER_ADMIN',panel_type='SUPER_ADMIN',display_name='Prem Super Admin',permissions='["ALL"]',is_active=1
           WHERE username=?`,
        )
        .bind(KORON_ADMIN_PASSWORD_HASH, KORON_ADMIN_USERNAME)
        .run();
    }

    account = await db
      .prepare(
        `SELECT username,password_hash passwordHash,role,panel_type panelType,is_active isActive,display_name displayName
         FROM market_panel_accounts WHERE lower(username)=?`,
      )
      .bind(username)
      .first<{
        username: string;
        passwordHash: string;
        role: PanelRole;
        panelType: PanelType;
        isActive: number;
        displayName: string;
      }>();
  }

  const valid =
    !!account &&
    account.isActive === 1 &&
    (account.role !== "SUPER_ADMIN" || isSuperAdminUsername(username)) &&
    (await passwordHash(password)) === account.passwordHash;

  const meta = await requestMeta();
  await db
    .prepare("INSERT INTO market_login_activity (username,success,ip_address,user_agent) VALUES (?,?,?,?)")
    .bind(username, valid ? 1 : 0, meta.ip, meta.agent)
    .run();

  if (!valid)
    return Response.json({ error: "User ID ya password galat hai" }, { status: 401 });

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  await db.prepare("DELETE FROM market_panel_sessions WHERE expires_at<=CURRENT_TIMESTAMP").run();
  await db
    .prepare("INSERT INTO market_panel_sessions (token_hash,username,expires_at) VALUES (?,?,datetime('now','+30 days'))")
    .bind(await sha256(token), account.username)
    .run();
  await db
    .prepare("UPDATE market_panel_accounts SET last_login=CURRENT_TIMESTAMP WHERE username=?")
    .bind(account.username)
    .run();

  (await cookies()).set(panelCookie(account.role), token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 2592000,
  });

  return Response.json({ ok: true, route: panelRoute(account) });
}
