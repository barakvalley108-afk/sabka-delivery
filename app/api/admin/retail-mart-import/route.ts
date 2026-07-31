import { ensureControlTables } from "../../../../db/control-store";
import { getPanelSession } from "../../../panel-auth";

type ImportItem = {
  category: string;
  name: string;
  quantity: string;
  mrp: number;
  stock: number;
  expiry?: string;
};

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character] || character);

function generatedLandscapeImage(item: ImportItem) {
  const name = escapeXml(item.name.slice(0, 44));
  const category = escapeXml(item.category.slice(0, 28));
  const quantity = escapeXml(item.quantity || "1 pack");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff8df"/><stop offset="1" stop-color="#ffd969"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="12" stdDeviation="18" flood-opacity=".18"/></filter></defs><rect width="1200" height="675" fill="url(#g)"/><circle cx="1030" cy="90" r="210" fill="#c7181b" opacity=".08"/><circle cx="120" cy="610" r="250" fill="#ffffff" opacity=".45"/><rect x="80" y="80" width="1040" height="515" rx="42" fill="#fff" filter="url(#s)"/><text x="130" y="155" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#c7181b">RETAIL MART · ${category}</text><text x="130" y="285" font-family="Arial,sans-serif" font-size="58" font-weight="800" fill="#20251f">${name}</text><text x="130" y="370" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="#667067">${quantity}</text><rect x="130" y="430" width="250" height="82" rx="20" fill="#c7181b"/><text x="255" y="484" text-anchor="middle" font-family="Arial,sans-serif" font-size="33" font-weight="800" fill="#fff">₹${Math.max(0, item.mrp - 1)}</text><text x="420" y="480" font-family="Arial,sans-serif" font-size="28" fill="#777">MRP ₹${item.mrp}</text><text x="1060" y="550" text-anchor="end" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#c7181b">SABKA DELIVERY</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export async function POST(request: Request) {
  const session = await getPanelSession("SUPER_ADMIN");
  if (!session || session.role !== "SUPER_ADMIN")
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const payload = (await request.json()) as { items?: ImportItem[] };
  const items = Array.isArray(payload.items) ? payload.items.slice(0, 1000) : [];
  if (!items.length)
    return Response.json({ error: "Import ke liye products nahi mile" }, { status: 400 });

  const db = await ensureControlTables();
  const store = await db
    .prepare("SELECT id FROM market_stores WHERE lower(trim(name))='retail mart' LIMIT 1")
    .first<{ id: number }>();
  if (!store)
    return Response.json({ error: "Retail Mart shop pehle create karo" }, { status: 400 });

  let added = 0;
  let skipped = 0;
  const categories = new Map<string, number>();

  for (const raw of items) {
    const name = String(raw.name || "").trim().slice(0, 160);
    const category = String(raw.category || "General").trim().slice(0, 60);
    const quantity = String(raw.quantity || "1 pack").trim().slice(0, 50);
    const mrp = Math.round(Number(raw.mrp || 0));
    const stock = Math.max(0, Math.floor(Number(raw.stock || 0)));
    if (name.length < 2 || category.length < 2 || mrp <= 0 || stock <= 0) {
      skipped += 1;
      continue;
    }

    const exists = await db
      .prepare(`SELECT i.id FROM market_items i JOIN market_variants v ON v.item_id=i.id
                WHERE i.store_id=? AND lower(trim(i.name))=lower(trim(?)) AND lower(trim(v.label))=lower(trim(?)) LIMIT 1`)
      .bind(store.id, name, quantity)
      .first();
    if (exists) {
      skipped += 1;
      continue;
    }

    if (!categories.has(category.toLowerCase())) {
      const categoryName = `RETAIL MART · ${category}`;
      await db
        .prepare(`INSERT INTO market_categories (name,image,is_active,sort_order,vertical)
                  VALUES (?,?,1,500,'GROCERY') ON CONFLICT(name) DO UPDATE SET is_active=1,vertical='GROCERY'`)
        .bind(categoryName, generatedLandscapeImage({ ...raw, name: category, category, quantity: "Category", mrp, stock }))
        .run();
      categories.set(category.toLowerCase(), 1);
    }

    const result = await db
      .prepare(`INSERT INTO market_items
                (store_id,name,description,category,subcategory,image,emoji,food_type,is_active)
                VALUES (?,?,?,?,?,?, '', 'VEG',1)`)
      .bind(
        store.id,
        name,
        "",
        `RETAIL MART · ${category}`,
        "",
        generatedLandscapeImage({ ...raw, name, category, quantity, mrp, stock }),
      )
      .run();
    const itemId = Number(result.meta.last_row_id);
    await db
      .prepare(`INSERT INTO market_variants
                (item_id,label,unit,unit_value,price,discount_price,discount_percent,stock_quantity,is_active)
                VALUES (?,?,?,?,?,?,?,?,1)`)
      .bind(itemId, quantity, "PACK", 1, mrp, Math.max(0, mrp - 1), mrp > 1 ? 1 : 0, stock)
      .run();
    added += 1;
  }

  return Response.json({ ok: true, added, skipped, total: items.length });
}
