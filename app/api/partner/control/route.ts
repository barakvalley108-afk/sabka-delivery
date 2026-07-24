import { ensureControlTables } from "../../../../db/control-store";
import { getPanelSession } from "../../../panel-auth";

const clampOfferPrice = (price: number, value: unknown) => {
  const offer = Number(value);
  if (!Number.isFinite(offer)) return price;
  return Math.max(0, Math.min(price, Math.round(offer)));
};
const discountPercentFromOffer = (price: number, offer: number) =>
  price > 0 && offer < price ? Math.round(((price - offer) / price) * 100) : 0;

async function partner() {
  const session = await getPanelSession("RESTAURANT");
  if (!session || session.role !== "RESTAURANT") return null;
  return session;
}

export async function GET() {
  const session = await partner();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.storeId)
    return Response.json(
      { error: "Is panel user ko abhi shop assign nahi hua hai." },
      { status: 409 },
    );
  const db = await ensureControlTables();
  const [store, orders, orderItems, items] = await db.batch([
    db
      .prepare(
        `SELECT s.id,s.name,s.description,s.address,s.image,s.is_open isOpen,
                coalesce(ss.section_key,p.vertical,s.type) vertical,s.rating,
                c.commission_rate commissionRate
         FROM market_stores s
         LEFT JOIN market_store_sections ss ON ss.store_id=s.id
         LEFT JOIN market_store_profiles p ON p.store_id=s.id
         LEFT JOIN market_store_controls c ON c.store_id=s.id WHERE s.id=?`,
      )
      .bind(session.storeId),
    db
      .prepare(
        `SELECT o.order_code orderCode,o.customer_name customerName,o.mobile,o.address,o.area,
                o.payment_method paymentMethod,o.total,o.status,o.created_at createdAt,
                a.rider_id riderId,r.name riderName
         FROM market_orders o
         LEFT JOIN market_delivery_assignments a ON a.order_code=o.order_code
         LEFT JOIN market_riders r ON r.id=a.rider_id
         WHERE o.store_id=? ORDER BY o.created_at DESC LIMIT 150`,
      )
      .bind(session.storeId),
    db
      .prepare(
        `SELECT oi.order_code orderCode,oi.item_name itemName,oi.variant_label variantLabel,
                oi.quantity,oi.unit_price unitPrice
         FROM market_order_items oi JOIN market_orders o ON o.order_code=oi.order_code
         WHERE o.store_id=?`,
      )
      .bind(session.storeId),
    db
      .prepare(
        `SELECT i.id,i.name,i.description,i.category,i.subcategory,i.food_type foodType,i.image,
                i.is_active isActive,v.id variantId,v.label,v.unit,v.unit_value unitValue,v.price,
                v.discount_price discountPrice,v.discount_percent discountPercent,
                v.stock_quantity stockQuantity
         FROM market_items i JOIN market_variants v ON v.item_id=i.id
         WHERE i.store_id=? ORDER BY i.id DESC`,
      )
      .bind(session.storeId),
  ]);
  const rows = orders.results as Array<{ status: string; total: number; createdAt: string }>;
  return Response.json({
    user: session.displayName,
    panelType: session.panelType,
    store: store.results[0],
    orders: orders.results,
    orderItems: orderItems.results,
    items: items.results,
    insights: {
      activeOrders: rows.filter((row) => !["DELIVERED", "CANCELLED"].includes(row.status)).length,
      todayOrders: rows.filter((row) => new Date(String(row.createdAt)+"Z").toDateString() === new Date().toDateString()).length,
      totalSales: rows.filter((row) => row.status === "DELIVERED").reduce((sum, row) => sum + Number(row.total), 0),
    },
  }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
}

export async function PATCH(request: Request) {
  const session = await partner();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.storeId)
    return Response.json(
      { error: "Is panel user ko abhi shop assign nahi hua hai." },
      { status: 409 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  const db = await ensureControlTables();
  if (body.action === "order") {
    const order = await db
      .prepare(`SELECT o.status,coalesce(ss.section_key,p.vertical,s.type) storeType
                FROM market_orders o JOIN market_stores s ON s.id=o.store_id
                LEFT JOIN market_store_sections ss ON ss.store_id=s.id
                LEFT JOIN market_store_profiles p ON p.store_id=s.id
                WHERE o.order_code=? AND o.store_id=?`)
      .bind(String(body.orderCode), session.storeId)
      .first<{ status: string; storeType: string }>();
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
    const next = String(body.status);
    const retail = order.storeType !== "FOOD";
    const allowed: Record<string, string[]> = retail
      ? {
          ACCEPTED: ["CONFIRMED", "CANCELLED"],
          CONFIRMED: ["PACKING", "CANCELLED"],
          PACKING: ["READY_FOR_PICKUP"],
          READY_FOR_PICKUP: [],
        }
      : {
          ACCEPTED: ["CONFIRMED", "CANCELLED"],
          CONFIRMED: ["PREPARING", "CANCELLED"],
          PREPARING: ["READY_FOR_PICKUP"],
          READY_FOR_PICKUP: [],
        };
    if (!allowed[order.status]?.includes(next))
      return Response.json({ error: "Is order stage par action allowed nahi hai" }, { status: 409 });
    await db.batch([
      db
        .prepare("UPDATE market_orders SET status=? WHERE order_code=?")
        .bind(next, String(body.orderCode)),
      db
        .prepare(
          "INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) VALUES (?,?,?,?,?)",
        )
        .bind(
          String(body.orderCode),
          next,
          "PARTNER",
          session.username,
          "Partner status update",
        ),
    ]);
  } else if (body.action === "item") {
    const owned = await db
      .prepare(`SELECT i.id,i.name,i.description,i.category,i.subcategory,i.food_type foodType,
                       i.image,i.is_active isActive,v.label,v.unit,v.unit_value unitValue,
                       v.price,v.discount_price discountPrice,v.discount_percent discountPercent,
                       v.stock_quantity stockQuantity
                FROM market_variants v JOIN market_items i ON i.id=v.item_id
                WHERE v.id=? AND i.store_id=?`)
      .bind(Number(body.variantId), session.storeId)
      .first<Record<string, unknown>>();
    if (!owned) return Response.json({ error: "Item not found" }, { status: 404 });
    const present = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
    const name = present("name") ? String(body.name || "").trim() : String(owned.name);
    const price = present("price") ? Number(body.price) : Number(owned.price);
    let discountPrice: number;
    let discountPercent: number;
    if (present("discountPrice")) {
      discountPrice = clampOfferPrice(price, body.discountPrice);
      discountPercent = discountPercentFromOffer(price, discountPrice);
    } else {
      discountPercent = present("discountPercent")
        ? Math.floor(Number(body.discountPercent))
        : Number(owned.discountPercent || 0);
      discountPrice = discountPercent > 0
        ? Math.round(price * (100 - discountPercent) / 100)
        : present("discountPercent")
          ? price
          : clampOfferPrice(price, owned.discountPrice ?? price);
    }
    const stockQuantity = present("stockQuantity") ? Number(body.stockQuantity) : Number(owned.stockQuantity);
    const unitValue = present("unitValue") ? Number(body.unitValue) : Number(owned.unitValue);
    const isActive = present("isActive") ? (body.isActive ? 1 : 0) : Number(owned.isActive);
    if (name.length < 2 || !Number.isFinite(price) || price < 0 || !Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice > price || stockQuantity < 0 || unitValue <= 0 || !Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100)
      return Response.json({ error: "Item details valid nahi hain" }, { status: 400 });
    await db.batch([
      db.prepare(`UPDATE market_items SET name=?,description=?,category=?,subcategory=?,image=?,
                  food_type=?,is_active=? WHERE id=?`).bind(
        name,
        present("description") ? String(body.description || "") : String(owned.description || ""),
        present("category") ? String(body.category || "General") : String(owned.category),
        present("subcategory") ? String(body.subcategory || "") : String(owned.subcategory || ""),
        present("image") ? String(body.image || "") : String(owned.image || ""),
        present("foodType") ? String(body.foodType || "VEG") : String(owned.foodType),
        isActive,
        Number(owned.id),
      ),
      db.prepare(`UPDATE market_variants SET label=?,unit=?,unit_value=?,price=?,discount_price=?,
                  discount_percent=?,stock_quantity=?,is_active=? WHERE id=?`).bind(
        present("label") ? String(body.label || "1 pack") : String(owned.label),
        present("unit") ? String(body.unit || "PIECE") : String(owned.unit),
        unitValue,
        price,
        discountPrice,
        discountPercent,
        stockQuantity,
        isActive,
        Number(body.variantId),
      ),
    ]);
  } else if (body.action === "store") {
    await db.prepare("UPDATE market_stores SET is_open=? WHERE id=?").bind(body.isOpen?1:0,session.storeId).run();
  } else return Response.json({ error: "Unknown action" }, { status: 400 });
  await db.prepare("INSERT INTO market_admin_activity (username,action,target,details) VALUES (?,?,?,?)").bind(session.username,`PARTNER_${String(body.action).toUpperCase()}`,String(body.orderCode||body.variantId||session.storeId),JSON.stringify({storeId:session.storeId})).run();
  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  const session = await partner();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.storeId)
    return Response.json(
      { error: "Is panel user ko abhi shop assign nahi hua hai." },
      { status: 409 },
    );
  const body = (await request.json()) as Record<string, unknown>;
  if (body.action !== "item") return Response.json({ error: "Unknown action" }, { status: 400 });
  const db = await ensureControlTables();
  const result = await db.prepare(`INSERT INTO market_items (store_id,name,description,category,subcategory,image,emoji,food_type,is_active) VALUES (?,?,?,?,?,?, '',?,1)`).bind(session.storeId,String(body.name||""),String(body.description||""),String(body.category||"General"),String(body.subcategory||""),String(body.image||"/images/hero-food-collage.png"),String(body.foodType||"VEG")).run();
  const itemId=Number(result.meta.last_row_id);
  const price=Number(body.price||0);
  const hasOfferPrice=body.discountPrice!==undefined&&body.discountPrice!=="";
  const discountPrice=hasOfferPrice?clampOfferPrice(price,body.discountPrice):Math.round(price*(100-Math.floor(Number(body.discountPercent||0)))/100);
  const discountPercent=hasOfferPrice?discountPercentFromOffer(price,discountPrice):Math.floor(Number(body.discountPercent||0));
  await db.prepare(`INSERT INTO market_variants (item_id,label,unit,unit_value,price,discount_price,discount_percent,stock_quantity,is_active) VALUES (?,?,?,?,?,?,?,?,1)`).bind(itemId,String(body.label||"1 pack"),String(body.unit||"PIECE"),Number(body.unitValue||1),price,discountPrice,discountPercent,Number(body.stockQuantity||0)).run();
  return Response.json({ok:true,itemId});
}
