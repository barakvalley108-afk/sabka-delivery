import { ensureControlTables } from "../../../../db/control-store";
import { getPanelSession } from "../../../panel-auth";

async function adminSession() {
  const session = await getPanelSession("SUPER_ADMIN");
  return session?.role === "SUPER_ADMIN" ? session : null;
}

const validDate = (value: string) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value);

export async function POST(request: Request) {
  const session = await adminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const itemId = Number(body.itemId);
  const expiryDate = String(body.expiryDate || "").trim();

  if (!Number.isInteger(itemId) || itemId < 1 || !validDate(expiryDate)) {
    return Response.json({ error: "Valid item aur expiry date required" }, { status: 400 });
  }

  const db = await ensureControlTables();
  const item = await db
    .prepare(
      `SELECT i.id,coalesce(ss.section_key,p.vertical,s.type) vertical
       FROM market_items i
       JOIN market_stores s ON s.id=i.store_id
       LEFT JOIN market_store_sections ss ON ss.store_id=s.id
       LEFT JOIN market_store_profiles p ON p.store_id=s.id
       WHERE i.id=?`,
    )
    .bind(itemId)
    .first<{ id: number; vertical: string }>();

  if (!item) return Response.json({ error: "Item nahi mila" }, { status: 404 });
  if (String(item.vertical).toUpperCase() !== "GROCERY") {
    return Response.json({ error: "Expiry date sirf grocery item ke liye hai" }, { status: 400 });
  }

  if (!expiryDate) {
    await db.prepare("DELETE FROM market_item_expiry WHERE item_id=?").bind(itemId).run();
    return Response.json({ ok: true });
  }

  await db
    .prepare(
      `INSERT INTO market_item_expiry (item_id,expiry_date,updated_at)
       VALUES (?,?,CURRENT_TIMESTAMP)
       ON CONFLICT(item_id) DO UPDATE SET expiry_date=excluded.expiry_date,
         updated_at=CURRENT_TIMESTAMP`,
    )
    .bind(itemId, expiryDate)
    .run();

  return Response.json({ ok: true, expiryDate });
}
