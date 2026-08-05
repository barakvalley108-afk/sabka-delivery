import { ensureControlTables } from "../../../db/control-store";
import { getPanelSession } from "../../panel-auth";

type Payload = { token?: string; panel?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const token = body.token?.trim() || "";
    const panel = (body.panel?.trim() || "CUSTOMER").slice(0, 30);
    if (token.length < 40 || token.length > 4096) {
      return Response.json({ error: "Invalid push token" }, { status: 400 });
    }

    const db = await ensureControlTables();
    await db.prepare(`CREATE TABLE IF NOT EXISTS market_push_subscriptions (
      token TEXT PRIMARY KEY,
      username TEXT,
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      panel_type TEXT NOT NULL DEFAULT 'CUSTOMER',
      store_id INTEGER,
      rider_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).run();
    await db.prepare("CREATE INDEX IF NOT EXISTS market_push_role_idx ON market_push_subscriptions(role,panel_type,store_id,rider_id,is_active)").run();

    const session = panel === "CUSTOMER" ? null : await getPanelSession();
    if (panel !== "CUSTOMER" && !session) {
      return Response.json({ error: "Panel login required" }, { status: 401 });
    }

    await db.prepare(`INSERT INTO market_push_subscriptions
      (token,username,role,panel_type,store_id,rider_id,is_active,updated_at)
      VALUES (?,?,?,?,?,?,1,CURRENT_TIMESTAMP)
      ON CONFLICT(token) DO UPDATE SET
        username=excluded.username,
        role=excluded.role,
        panel_type=excluded.panel_type,
        store_id=excluded.store_id,
        rider_id=excluded.rider_id,
        is_active=1,
        updated_at=CURRENT_TIMESTAMP`)
      .bind(
        token,
        session?.username || null,
        session?.role || "CUSTOMER",
        session?.panelType || panel,
        session?.storeId || null,
        session?.riderId || null,
      )
      .run();

    return Response.json({ ok: true });
  } catch (error) {
    console.error("push subscription failed", error);
    return Response.json({ error: "Push registration failed" }, { status: 500 });
  }
}
