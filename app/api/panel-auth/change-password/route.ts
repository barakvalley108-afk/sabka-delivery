import { cookies } from "next/headers";
import { ensureControlTables } from "../../../../db/control-store";
import { getPanelSession, passwordHash, sha256 } from "../../../panel-auth";

export async function POST(request: Request) {
  const session = await getPanelSession("SUPER_ADMIN");
  if (!session || session.username !== "dhoni1981") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };
  const currentPassword = body.currentPassword || "";
  const newPassword = body.newPassword || "";

  if (newPassword.length < 8) {
    return Response.json(
      { error: "New password minimum 8 characters ka hona chahiye" },
      { status: 400 },
    );
  }
  if (currentPassword === newPassword) {
    return Response.json(
      { error: "New password current password se different rakho" },
      { status: 400 },
    );
  }

  const db = await ensureControlTables();
  const account = await db
    .prepare(
      "SELECT password_hash passwordHash FROM market_panel_accounts WHERE username=? AND role='SUPER_ADMIN' AND is_active=1",
    )
    .bind("dhoni1981")
    .first<{ passwordHash: string }>();

  if (!account || (await passwordHash(currentPassword)) !== account.passwordHash) {
    return Response.json({ error: "Current password galat hai" }, { status: 401 });
  }

  await db
    .prepare("UPDATE market_panel_accounts SET password_hash=? WHERE username=? AND role='SUPER_ADMIN'")
    .bind(await passwordHash(newPassword), "dhoni1981")
    .run();

  // Keep the current owner session alive, but invalidate all other owner sessions.
  const currentToken = (await cookies()).get("sabka_admin_session")?.value;
  if (currentToken) {
    await db
      .prepare("DELETE FROM market_panel_sessions WHERE username=? AND token_hash<>?")
      .bind("dhoni1981", await sha256(currentToken))
      .run();
  } else {
    await db
      .prepare("DELETE FROM market_panel_sessions WHERE username=?")
      .bind("dhoni1981")
      .run();
  }

  await db
    .prepare("INSERT INTO market_admin_activity (username,action,target,details) VALUES (?,?,?,?)")
    .bind("dhoni1981", "OWNER_PASSWORD_CHANGE", "dhoni1981", JSON.stringify({ source: "owner-security" }))
    .run();

  return Response.json({ ok: true });
}
