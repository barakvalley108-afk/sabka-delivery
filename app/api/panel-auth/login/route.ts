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

const SESSION_HOURS = 8;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = (body.username || "")
      .trim()
      .toLowerCase()
      .slice(0, 120);

    const password = body.password || "";

    if (!username || !password) {
      return Response.json(
        {
          error: "User ID aur password required hai",
        },
        { status: 400 },
      );
    }

    const db = await ensureControlTables();
    const meta = await requestMeta();

    const recentFailures = await db
      .prepare(
        `SELECT count(*) total
         FROM market_login_activity
         WHERE username=?
           AND ip_address=?
           AND success=0
           AND created_at>=datetime('now', ?)`,
      )
      .bind(
        username,
        meta.ip,
        `-${LOCK_MINUTES} minutes`,
      )
      .first<{ total: number }>();

    if (
      Number(recentFailures?.total || 0) >=
      MAX_FAILED_ATTEMPTS
    ) {
      return Response.json(
        {
          error:
            "Bahut zyada galat login attempts hue hain. 15 minute baad dobara try karo.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(LOCK_MINUTES * 60),
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const account = await db
      .prepare(
        `SELECT
           username,
           password_hash passwordHash,
           role,
           panel_type panelType,
           is_active isActive
         FROM market_panel_accounts
         WHERE lower(username)=?`,
      )
      .bind(username)
      .first<{
        username: string;
        passwordHash: string;
        role: PanelRole;
        panelType: PanelType;
        isActive: number;
      }>();

    const suppliedHash = await passwordHash(password);

    const valid =
      Boolean(account) &&
      account?.isActive === 1 &&
      suppliedHash === account?.passwordHash;

    await db
      .prepare(
        `INSERT INTO market_login_activity
         (username,success,ip_address,user_agent)
         VALUES (?,?,?,?)`,
      )
      .bind(
        username,
        valid ? 1 : 0,
        meta.ip,
        meta.agent,
      )
      .run();

    if (!valid || !account) {
      return Response.json(
        {
          error: "User ID ya password galat hai",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);

    const token = Array.from(bytes)
      .map((byte) =>
        byte.toString(16).padStart(2, "0"),
      )
      .join("");

    const tokenHash = await sha256(token);

    await db.batch([
      db
        .prepare(
          `DELETE FROM market_panel_sessions
           WHERE expires_at<=CURRENT_TIMESTAMP`,
        ),

      db
        .prepare(
          `DELETE FROM market_panel_sessions
           WHERE username=?`,
        )
        .bind(account.username),

      db
        .prepare(
          `INSERT INTO market_panel_sessions
           (token_hash,username,expires_at)
           VALUES (
             ?,
             ?,
             datetime('now', ?)
           )`,
        )
        .bind(
          tokenHash,
          account.username,
          `+${SESSION_HOURS} hours`,
        ),

      db
        .prepare(
          `UPDATE market_panel_accounts
           SET last_login=CURRENT_TIMESTAMP
           WHERE username=?`,
        )
        .bind(account.username),
    ]);

    const jar = await cookies();

    jar.set(panelCookie(account.role), token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    return Response.json(
      {
        ok: true,
        route: panelRoute(account),
        sessionHours: SESSION_HOURS,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Panel login failed", error);

    return Response.json(
      {
        error:
          "Login abhi complete nahi hua. Dobara try karo.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
