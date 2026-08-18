import { ensureControlTables } from "../../../../db/control-store";
import { getPanelSession, isOwnerUsername } from "../../../panel-auth";

async function requireAdmin() {
  const session = await getPanelSession("SUPER_ADMIN");
  return session && (session.role === "SUPER_ADMIN" || isOwnerUsername(session.username)) ? session : null;
}

async function ensureSlabTable(db: Awaited<ReturnType<typeof ensureControlTables>>) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS market_store_commission_slabs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    min_amount REAL NOT NULL DEFAULT 0,
    max_amount REAL,
    commission REAL NOT NULL DEFAULT 0,
    commission_type TEXT NOT NULL DEFAULT 'FIXED' CHECK(commission_type IN ('FIXED','PERCENT')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS market_store_commission_slabs_store_idx ON market_store_commission_slabs(store_id,min_amount)`).run();
}

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const db = await ensureControlTables();
  await ensureSlabTable(db);
  const storeId = new URL(request.url).searchParams.get("storeId");
  const rows = storeId
    ? await db.prepare(`SELECT id,store_id storeId,min_amount minAmount,max_amount maxAmount,commission,commission_type commissionType,is_active isActive FROM market_store_commission_slabs WHERE store_id=? ORDER BY min_amount`).bind(Number(storeId)).all()
    : await db.prepare(`SELECT id,store_id storeId,min_amount minAmount,max_amount maxAmount,commission,commission_type commissionType,is_active isActive FROM market_store_commission_slabs ORDER BY store_id,min_amount`).all();
  return Response.json({ slabs: rows.results });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const db = await ensureControlTables();
  await ensureSlabTable(db);
  const body = (await request.json()) as Record<string, unknown>;
  const action = String(body.action || "upsert");
  const storeId = Number(body.storeId);
  if (!Number.isInteger(storeId) || storeId < 1) return Response.json({ error: "Valid storeId required" }, { status: 400 });
  if (action === "delete") {
    await db.prepare("DELETE FROM market_store_commission_slabs WHERE id=? AND store_id=?").bind(Number(body.id), storeId).run();
    return Response.json({ ok: true });
  }
  if (action === "replace") {
    const slabs = Array.isArray(body.slabs) ? body.slabs : [];
    const statements = [db.prepare("DELETE FROM market_store_commission_slabs WHERE store_id=?").bind(storeId)];
    for (const raw of slabs) {
      const slab = raw as Record<string, unknown>;
      const min = Number(slab.minAmount);
      const max = slab.maxAmount === null || slab.maxAmount === "" || slab.maxAmount === undefined ? null : Number(slab.maxAmount);
      const commission = Number(slab.commission);
      const type = String(slab.commissionType || "FIXED").toUpperCase() === "PERCENT" ? "PERCENT" : "FIXED";
      if (!Number.isFinite(min) || min < 0 || (max !== null && (!Number.isFinite(max) || max <= min)) || !Number.isFinite(commission) || commission < 0) continue;
      statements.push(db.prepare("INSERT INTO market_store_commission_slabs(store_id,min_amount,max_amount,commission,commission_type) VALUES(?,?,?,?,?)").bind(storeId,min,max,commission,type));
    }
    await db.batch(statements);
    return Response.json({ ok: true });
  }
  const min = Number(body.minAmount);
  const max = body.maxAmount === null || body.maxAmount === "" || body.maxAmount === undefined ? null : Number(body.maxAmount);
  const commission = Number(body.commission);
  const type = String(body.commissionType || "FIXED").toUpperCase() === "PERCENT" ? "PERCENT" : "FIXED";
  if (!Number.isFinite(min) || min < 0 || (max !== null && (!Number.isFinite(max) || max <= min)) || !Number.isFinite(commission) || commission < 0) return Response.json({ error: "Invalid commission slab" }, { status: 400 });
  if (body.id) {
    await db.prepare("UPDATE market_store_commission_slabs SET min_amount=?,max_amount=?,commission=?,commission_type=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND store_id=?").bind(min,max,commission,type,Number(body.id),storeId).run();
  } else {
    await db.prepare("INSERT INTO market_store_commission_slabs(store_id,min_amount,max_amount,commission,commission_type) VALUES(?,?,?,?,?)").bind(storeId,min,max,commission,type).run();
  }
  return Response.json({ ok: true });
}
