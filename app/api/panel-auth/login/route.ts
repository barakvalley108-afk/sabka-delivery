import { cookies } from "next/headers";
import { ensureControlTables } from "../../../../db/control-store";
import {
  panelCookie,
  panelRoute,
  passwordHash,
  requestMeta,
  sha256,
  type PanelRole,
  type PanelType,
} from "../../../panel-auth";

const NEW_ADMIN_USERNAME = "koron2013";
const NEW_ADMIN_PASSWORD_HASH = "dca84a340d2dbd50d4c246b26e8a5075b7d65cf412b1122ff2940ceb796a4b05";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };
  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";
  if (!username || !password)
    return Response.json(
      { error: "User ID aur password required hai" },
      { status: 400 },
    );
  const db = await ensureControlTables();

  let account = await db
    .prepare(
      `SELECT username,password_hash passwordHash,role,panel_type panelType,is_active isActive
       FROM market_panel_accounts WHERE lower(username)=?`,
    )
    .bind(username)
    .first<{
      username: string;
      passwordHash: string;
      role: PanelRole;
      panelType: PanelType;
      isActive: number;
    }>();

  // Migrate the existing Super Admin account to the requested credentials
  // the first time the new credentials are used.
  if (
    !account &&
    username === NEW_ADMIN_USERNAME &&
    (await passwordHash(password)) === NEW_ADMIN_PASSWORD_HASH
  ) {
    const existingOwner = await db
      .prepare(
        `SELECT username FROM market_panel_accounts
         WHERE role='SUPER_ADMIN' AND is_active=1
         ORDER BY created_at ASC LIMIT 1`,
      )
      .first<{ username: string }>();

    if (existingOwner) {
      await db
        .prepare(
          `UPDATE market_panel_accounts
           SET username=?, password_hash=?, panel_type='SUPER_ADMIN', display_name='SABKA DELIVERY Owner', permissions='["ALL"]', is_active=1
           WHERE username=?`,
        )
        .bind(NEW_ADMIN_USERNAME, NEW_ADMIN_PASSWORD_HASH, existingOwner.username)
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO market_panel_accounts
           (username,password_hash,role,panel_type,display_name,permissions,is_active)
           VALUES (?,?,?,?,?,?,1)`,
        )
        .bind(
          NEW_ADMIN_USERNAME,
          NEW_ADMIN_PASSWORD_HASH,
          "SUPER_ADMIN",
          "SUPER_ADMIN",
          "SABKA DELIVERY Owner",
          '["ALL"]',
        )
        .run();
    }

    account = await db
      .prepare(
        `SELECT username,password_hash passwordHash,role,panel_type panelType,is_active isActive
         FROM market_panel_accounts WHERE lower(username)=?`,
      )
      .bind(username)
      .first<{
        username: string;
        passwordHash: string;
        role: PanelRole;
        panelType: PanelType;
        isActive: number;
      }>();
  }

  const valid =
    !!account &&
    account.isActive === 1 &&
    (account.role !== "SUPER_ADMIN" || username === NEW_ADMIN_USERNAME) &&
    (await passwordHash(password)) === account.passwordHash;
  const meta = await requestMeta();
  await db
    .prepare(
      "INSERT INTO market_login_activity (username,success,ip_address,user_agent) VALUES (?,?,?,?)",
    )
    .bind(username, valid ? 1 : 0, meta.ip, meta.agent)
    .run();
  if (!valid)
    return Response.json(
      { error: "User ID ya password galat hai" },
      { status: 401 },
    );
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  await db
    .prepare("DELETE FROM market_panel_sessions WHERE expires_at<=CURRENT_TIMESTAMP")
    .run();
  await db
    .prepare(
      "INSERT INTO market_panel_sessions (token_hash,username,expires_at) VALUES (?,?,datetime('now','+30 days'))",
    )
    .bind(await sha256(token), account.username)
    .run();
  await db
    .prepare(
      "UPDATE market_panel_accounts SET last_login=CURRENT_TIMESTAMP WHERE username=?",
    )
    .bind(account.username)
    .run();
  (await cookies()).set(panelCookie(account.role), token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 2592000,
  });
  return Response.json({
    ok: true,
    route: panelRoute(account),
  });
}
