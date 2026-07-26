import { ensureControlTables } from "../../../../db/control-store";
import { getPanelSession, passwordHash } from "../../../panel-auth";

const sectionKey = (value: unknown) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);

const discountedPrice = (price: number, percent: number) =>
  percent > 0 ? Math.max(0, Math.round(price * (100 - percent) / 100)) : price;
const clampOfferPrice = (price: number, value: unknown) => {
  const offer = Number(value);
  if (!Number.isFinite(offer)) return price;
  return Math.max(0, Math.min(price, Math.round(offer)));
};
const discountPercentFromOffer = (price: number, offer: number) =>
  price > 0 && offer < price ? Math.round(((price - offer) / price) * 100) : 0;

async function adminSession() {
  const session = await getPanelSession("SUPER_ADMIN");
  return session?.role === "SUPER_ADMIN" ? session : null;
}

async function activity(
  db: Awaited<ReturnType<typeof ensureControlTables>>,
  username: string,
  action: string,
  target: string,
) {
  await db
    .prepare(
      "INSERT INTO market_admin_activity (username,action,target,details) VALUES (?,?,?,?)",
    )
    .bind(username, action, target, JSON.stringify({ source: "admin-v2" }))
    .run();
}

export async function GET() {
  const session = await adminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const db = await ensureControlTables();
  const [
    stores,
    accounts,
    riders,
    payouts,
    orders,
    orderItems,
    items,
    notifications,
    settings,
    promotions,
    offers,
    content,
    categories,
    sections,
    summary,
  ] = await db.batch([
    db.prepare(
      `SELECT s.id,s.name,s.type,s.description,s.address,s.image,s.is_open isOpen,
              coalesce(ss.section_key,p.vertical,s.type) vertical,c.approved,c.blocked,
              c.commission_rate commissionRate,op.opening_time openingTime,
              op.closing_time closingTime
       FROM market_stores s
       LEFT JOIN market_store_sections ss ON ss.store_id=s.id
       LEFT JOIN market_store_profiles p ON p.store_id=s.id
       LEFT JOIN market_store_controls c ON c.store_id=s.id
       LEFT JOIN market_store_operations op ON op.store_id=s.id
       ORDER BY s.id DESC`,
    ),
    db.prepare(
      `SELECT username,role,panel_type panelType,display_name displayName,
              store_id storeId,rider_id riderId,is_active isActive,last_login lastLogin
       FROM market_panel_accounts ORDER BY created_at DESC`,
    ),
    db.prepare(
      `SELECT r.id,r.name,r.email,r.phone,r.is_online isOnline,
              r.document_status documentStatus,r.cod_collection codCollection,
              r.upi_id upiId,r.latitude,r.longitude,
              max(0,
                coalesce((SELECT sum(20+coalesce(a.tip,0))
                          FROM market_delivery_assignments a
                          WHERE a.rider_id=r.id AND a.status='DELIVERED'),0)-
                coalesce((SELECT sum(p.amount) FROM market_payouts p
                          WHERE p.payee_type='RIDER' AND p.payee_id=r.id
                            AND p.status IN ('PENDING','APPROVED','PAID')),0)
              ) weeklyPayout
       FROM market_riders r ORDER BY r.id DESC`,
    ),
    db.prepare(
      `SELECT p.id,p.payee_id riderId,p.amount,p.status,p.upi_id upiId,
              p.reference,p.created_at createdAt,p.completed_at completedAt,
              r.name riderName,r.phone riderPhone
       FROM market_payouts p JOIN market_riders r ON r.id=p.payee_id
       WHERE p.payee_type='RIDER' ORDER BY p.created_at DESC LIMIT 200`,
    ),
    db.prepare(
      `SELECT o.order_code orderCode,o.customer_name customerName,o.mobile,o.address,o.area,
              o.payment_method paymentMethod,o.subtotal,o.delivery_fee deliveryFee,o.total,
              o.status,o.created_at createdAt,s.name storeName,s.id storeId,
              a.rider_id riderId,r.name riderName,t.status paymentStatus
       FROM market_orders o
       JOIN market_stores s ON s.id=o.store_id
       LEFT JOIN market_delivery_assignments a ON a.order_code=o.order_code
       LEFT JOIN market_riders r ON r.id=a.rider_id
       LEFT JOIN market_transactions t ON t.order_code=o.order_code AND t.type='PAYMENT'
       ORDER BY o.created_at DESC LIMIT 200`,
    ),
    db.prepare(
      "SELECT order_code orderCode,item_name itemName,variant_label variantLabel,quantity,unit_price unitPrice FROM market_order_items",
    ),
    db.prepare(
      `SELECT i.id,i.store_id storeId,s.name storeName,i.name,i.description,i.category,
              i.subcategory,i.food_type foodType,i.image,i.is_active isActive,
              v.id variantId,v.label,v.unit,v.unit_value unitValue,v.price,
              v.discount_price discountPrice,v.discount_percent discountPercent,
              v.stock_quantity stockQuantity
       FROM market_items i JOIN market_stores s ON s.id=i.store_id
       JOIN market_variants v ON v.item_id=i.id ORDER BY i.id DESC`,
    ),
    db.prepare(
      `SELECT id,type,title,message,order_code orderCode,is_read isRead,created_at createdAt
       FROM market_admin_notifications ORDER BY id DESC LIMIT 40`,
    ),
    db.prepare(
      "SELECT key,value FROM market_settings WHERE key IN ('upi_id','delivery_charge','support_number','maintenance_mode','order_accept_mode','website_name','theme_primary','theme_accent','theme_background')",
    ),
    db.prepare(
      `SELECT p.code,p.title,p.discount_type discountType,p.discount_value discountValue,
              p.min_order minOrder,p.is_active isActive,p.uses,p.sort_order sortOrder,
              r.max_discount maxDiscount,r.expires_at expiresAt,
              coalesce(r.auto_pause_after_use,0) autoPauseAfterUse,
              coalesce(r.show_on_website,1) showOnWebsite,
              coalesce(r.usage_limit,0) usageLimit
       FROM market_promotions p LEFT JOIN market_promotion_rules r ON r.code=p.code
       ORDER BY p.sort_order,p.created_at DESC,p.code`,
    ),
    db.prepare(
      `SELECT id,title,description,qualifying_orders qualifyingOrders,
              window_days windowDays,reward_type rewardType,reward_value rewardValue,
              min_order minOrder,is_active isActive,uses
       FROM market_reward_offers ORDER BY created_at DESC`,
    ),
    db.prepare(
      "SELECT key,title,body,image FROM market_content ORDER BY key",
    ),
    db.prepare(
      `SELECT id,CASE WHEN name LIKE '__ALL__:%' THEN 'All' ELSE name END name,
              image,is_active isActive,sort_order sortOrder,vertical
       FROM market_categories ORDER BY vertical,sort_order,name`,
    ),
    db.prepare(
      `SELECT key,name,description,image,icon,is_active isActive,sort_order sortOrder,
              coalesce((SELECT cast(value as integer) FROM market_settings WHERE key='minimum_order_'||market_sections.key),0) minOrder,
              coalesce((SELECT cast(value as integer) FROM market_settings WHERE key='delivery_charge_'||market_sections.key),
                       (SELECT cast(value as integer) FROM market_settings WHERE key='delivery_charge'),20) deliveryCharge
       FROM market_sections ORDER BY sort_order,name`,
    ),
    db.prepare(
      `SELECT
         (SELECT count(*) FROM market_orders WHERE date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) totalOrders,
         (SELECT coalesce(sum(total),0) FROM market_orders WHERE status='DELIVERED' AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) totalSales,
         (SELECT count(*) FROM market_orders WHERE status NOT IN ('DELIVERED','CANCELLED') AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) activeOrders,
         (SELECT count(*) FROM market_stores WHERE is_open=1) openStores,
         (SELECT count(*) FROM market_riders WHERE is_online=1) onlineRiders,
         (SELECT count(*) FROM market_panel_sessions WHERE expires_at>CURRENT_TIMESTAMP) activePanels`,
    ),
  ]);
  return Response.json({
    owner: session.displayName,
    stores: stores.results,
    accounts: accounts.results,
    riders: riders.results,
    payouts: payouts.results,
    orders: orders.results,
    orderItems: orderItems.results,
    items: items.results,
    notifications: notifications.results,
    settings: Object.fromEntries(
      settings.results.map((row) => [String(row.key), String(row.value)]),
    ),
    promotions: promotions.results,
    offers: offers.results,
    content: content.results,
    categories: categories.results,
    sections: sections.results,
    summary: summary.results[0] || {},
  });
}

export async function POST(request: Request) {
  const session = await adminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const action = String(body.action || "");
  const db = await ensureControlTables();
  try {
    if (action === "shop") {
      const name = String(body.name || "").trim();
      const vertical = sectionKey(body.vertical) || "FOOD";
      const section = await db
        .prepare("SELECT key FROM market_sections WHERE key=? AND is_active=1")
        .bind(vertical)
        .first();
      if (name.length < 2)
        return Response.json({ error: "Shop name required" }, { status: 400 });
      if (!section)
        return Response.json({ error: "Valid active section select karo" }, { status: 400 });
      const baseType = vertical === "FOOD" ? "FOOD" : "GROCERY";
      const legacyVertical = ["FOOD", "GROCERY", "ELECTRONICS"].includes(vertical)
        ? vertical
        : baseType;
      const result = await db
        .prepare(
          `INSERT INTO market_stores (name,type,description,address,latitude,longitude,eta,rating,image,is_open)
           VALUES (?,?,?,?,?,?,?,?,?,1)`,
        )
        .bind(
          name,
          baseType,
          String(body.description || ""),
          String(body.address || "Lala Bazar"),
          Number(body.latitude || 24.553),
          Number(body.longitude || 92.6),
          String(body.eta || "25-35 min"),
          4.5,
          String(body.image || "/images/hero-food-collage.png"),
        )
        .run();
      const storeId = Number(result.meta.last_row_id);
      await db.batch([
        db
          .prepare(
            "INSERT INTO market_store_profiles (store_id,vertical) VALUES (?,?)",
          )
          .bind(storeId, legacyVertical),
        db
          .prepare(
            "INSERT INTO market_store_sections (store_id,section_key) VALUES (?,?)",
          )
          .bind(storeId, vertical),
        db
          .prepare(
            "INSERT INTO market_store_controls (store_id,commission_rate,approved,blocked) VALUES (?,18,1,0)",
          )
          .bind(storeId),
        db
          .prepare("INSERT INTO market_store_operations (store_id,opening_time,closing_time) VALUES (?,?,?)")
          .bind(
            storeId,
            String(body.openingTime || "09:00"),
            String(body.closingTime || "22:00"),
          ),
      ]);
      await activity(db, session.username, "SHOP_CREATE", String(storeId));
      return Response.json({ ok: true, storeId });
    }
    if (action === "rider") {
      const name = String(body.name || "").trim();
      const phone = String(body.phone || "").trim();
      if (name.length < 2 || !/^\d{10}$/.test(phone))
        return Response.json(
          { error: "Valid rider name aur phone required" },
          { status: 400 },
        );
      const result = await db
        .prepare(
          `INSERT INTO market_riders (email,name,phone,document_status)
           VALUES (?,?,?,'VERIFIED')`,
        )
        .bind(
          String(body.email || `${phone}@sabkadelivery.local`),
          name,
          phone,
        )
        .run();
      const riderId = Number(result.meta.last_row_id);
      await activity(db, session.username, "RIDER_CREATE", String(riderId));
      return Response.json({ ok: true, riderId });
    }
    if (action === "account") {
      const username = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "");
      const requestedPanelType = String(body.panelType || "RESTAURANT").toUpperCase();
      const panelType = ["RESTAURANT", "GROCERY", "ELECTRONICS", "DELIVERY"].includes(requestedPanelType)
        ? requestedPanelType
        : "RESTAURANT";
      if (!/^[a-z0-9._-]{4,30}$/.test(username) || password.length < 8)
        return Response.json(
          { error: "User ID 4+ chars aur password 8+ chars rakho" },
          { status: 400 },
        );
      const role = panelType === "DELIVERY" ? "RIDER" : "RESTAURANT";
      const requestedStoreId = Number(body.storeId);
      const requestedRiderId = Number(body.riderId);
      const storeId =
        panelType === "DELIVERY" || !Number.isInteger(requestedStoreId) || requestedStoreId < 1
          ? null
          : requestedStoreId;
      const riderId =
        panelType !== "DELIVERY" || !Number.isInteger(requestedRiderId) || requestedRiderId < 1
          ? null
          : requestedRiderId;
      await db
        .prepare(
          `INSERT INTO market_panel_accounts
           (username,password_hash,role,panel_type,display_name,store_id,rider_id,permissions,is_active)
           VALUES (?,?,?,?,?,?,?,'[]',1)`,
        )
        .bind(
          username,
          await passwordHash(password),
          role,
          panelType,
          String(body.displayName || username),
          storeId,
          riderId,
        )
        .run();
      await activity(db, session.username, "ACCOUNT_CREATE", username);
      return Response.json({ ok: true });
    }
    if (action === "item") {
      const storeId = Number(body.storeId);
      const name = String(body.name || "").trim();
      const price = Number(body.price || 0);
      const hasOfferPrice = body.discountPrice !== undefined && body.discountPrice !== "";
      const discountPrice = hasOfferPrice
        ? clampOfferPrice(price, body.discountPrice)
        : discountedPrice(price, Math.floor(Number(body.discountPercent || 0)));
      const discountPercent = hasOfferPrice
        ? discountPercentFromOffer(price, discountPrice)
        : Math.floor(Number(body.discountPercent || 0));
      if (
        !storeId ||
        name.length < 2 ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(discountPrice) ||
        discountPrice < 0 ||
        discountPrice > price ||
        !Number.isInteger(discountPercent) ||
        discountPercent < 0 ||
        discountPercent > 100
      )
        return Response.json(
          { error: "Shop, item, price aur offer price valid rakho" },
          { status: 400 },
        );
      const result = await db
        .prepare(
          `INSERT INTO market_items
           (store_id,name,description,category,subcategory,image,emoji,food_type,is_active)
           VALUES (?,?,?,?,?,?, '',?,1)`,
        )
        .bind(
          storeId,
          name,
          String(body.description || ""),
          String(body.category || "General"),
          String(body.subcategory || ""),
          String(body.image || "/images/hero-food-collage.png"),
          String(body.foodType || "VEG"),
        )
        .run();
      const itemId = Number(result.meta.last_row_id);
      await db
        .prepare(
          `INSERT INTO market_variants
           (item_id,label,unit,unit_value,price,discount_price,discount_percent,stock_quantity,is_active)
           VALUES (?,?,?,?,?,?,?,?,1)`,
        )
        .bind(
          itemId,
          String(body.label || "1 pack"),
          String(body.unit || "PIECE"),
          Number(body.unitValue || 1),
          price,
          discountPrice,
          discountPercent,
          Number(body.stockQuantity || 0),
        )
        .run();
      await activity(db, session.username, "ITEM_CREATE", String(itemId));
      return Response.json({ ok: true, itemId });
    }
    if (action === "section") {
      const name = String(body.name || "").trim();
      const key = sectionKey(body.key || name);
      const description = String(body.description || "").trim();
      const image = String(body.image || "");
      const icon = String(body.icon || "▦").trim().slice(0, 4) || "▦";
      const sortOrder = Math.floor(Number(body.sortOrder || 0));
      if (
        key.length < 2 ||
        name.length < 2 ||
        name.length > 40 ||
        image.length > 1_500_000 ||
        !Number.isInteger(sortOrder) ||
        sortOrder < 0 ||
        sortOrder > 999
      )
        return Response.json(
          { error: "Valid section name, photo aur display order required" },
          { status: 400 },
        );
      await db
        .prepare(
          `INSERT INTO market_sections
           (key,name,description,image,icon,is_active,sort_order,updated_at)
           VALUES (?,?,?,?,?,1,?,CURRENT_TIMESTAMP)`,
        )
        .bind(key, name, description, image, icon, sortOrder)
        .run();
      await activity(db, session.username, "SECTION_CREATE", key);
      return Response.json({ ok: true, key });
    }
    if (action === "category") {
      const name = String(body.name || "").trim();
      const vertical = sectionKey(body.vertical) || "FOOD";
      const section = await db
        .prepare("SELECT key FROM market_sections WHERE key=?")
        .bind(vertical)
        .first();
      const image = String(body.image || "");
      const sortOrder = Number(body.sortOrder || 0);
      const storedName =
        name.toLowerCase() === "all" ? `__ALL__:${vertical}` : name;
      if (
        name.length < 2 ||
        name.length > 60 ||
        image.length > 1_500_000 ||
        !section ||
        !Number.isInteger(sortOrder) ||
        sortOrder < 0 ||
        sortOrder > 999
      )
        return Response.json(
          { error: "Valid category name, photo aur order required" },
          { status: 400 },
        );
      const result = await db
        .prepare(
          `INSERT INTO market_categories
           (name,image,is_active,sort_order,vertical) VALUES (?,?,1,?,?)
           ON CONFLICT(name) DO UPDATE SET image=excluded.image,
             is_active=1,sort_order=excluded.sort_order,vertical=excluded.vertical`,
        )
        .bind(storedName, image, sortOrder, vertical)
        .run();
      const saved = await db
        .prepare("SELECT id FROM market_categories WHERE name=?")
        .bind(storedName)
        .first<{ id: number }>();
      await activity(
        db,
        session.username,
        "CATEGORY_SAVE",
        String(saved?.id || result.meta.last_row_id || storedName),
      );
      return Response.json({ ok: true, id: saved?.id });
    }
    if (action === "rewardOffer") {
      const title = String(body.title || "").trim();
      const description = String(body.description || "").trim();
      const qualifyingOrders = Number(body.qualifyingOrders);
      const windowDays = Number(body.windowDays);
      const minOrder = Number(body.minOrder || 0);
      if (
        title.length < 3 ||
        description.length < 5 ||
        !Number.isInteger(qualifyingOrders) ||
        qualifyingOrders < 1 ||
        qualifyingOrders > 50 ||
        !Number.isInteger(windowDays) ||
        windowDays < 1 ||
        windowDays > 365 ||
        !Number.isFinite(minOrder) ||
        minOrder < 0
      )
        return Response.json(
          { error: "Valid automatic offer details required" },
          { status: 400 },
        );
      const result = await db
        .prepare(
          `INSERT INTO market_reward_offers
           (title,description,qualifying_orders,window_days,reward_type,reward_value,min_order,is_active)
           VALUES (?,?,?,?, 'FREE_DELIVERY',0,?,1)`,
        )
        .bind(title, description, qualifyingOrders, windowDays, minOrder)
        .run();
      const id = Number(result.meta.last_row_id);
      await activity(db, session.username, "REWARD_OFFER_CREATE", String(id));
      return Response.json({ ok: true, id });
    }
    if (action === "coupon") {
      const code = String(body.code || "").trim().toUpperCase();
      const title = String(body.title || "").trim();
      const discountType = body.discountType === "PERCENT" ? "PERCENT" : "FLAT";
      const discountValue = Number(body.discountValue);
      const minOrder = Number(body.minOrder || 0);
      const maxDiscount = Number(body.maxDiscount || 0);
      const usageLimit = Number(body.usageLimit || 0);
      const showOnWebsite = body.showOnWebsite === undefined || body.showOnWebsite ? 1 : 0;
      if (
        !/^[A-Z0-9]{4,20}$/.test(code) ||
        title.length < 2 ||
        !Number.isFinite(discountValue) ||
        discountValue <= 0 ||
        (discountType === "PERCENT" && discountValue > 100) ||
        !Number.isFinite(minOrder) ||
        minOrder < 0 ||
        !Number.isFinite(maxDiscount) ||
        maxDiscount < 0 ||
        !Number.isInteger(usageLimit) ||
        usageLimit < 0
      )
        return Response.json({ error: "Valid coupon details required" }, { status: 400 });
      await db.batch([
        db.prepare(
          `INSERT INTO market_promotions
           (code,title,discount_type,discount_value,min_order,is_active,sort_order)
           SELECT ?,?,?,?,?,1,coalesce(max(sort_order),-1)+1 FROM market_promotions`,
        ).bind(code,title,discountType,discountValue,minOrder),
        db.prepare(
          `INSERT INTO market_promotion_rules
           (code,expires_at,max_discount,auto_pause_after_use,show_on_website,usage_limit)
           VALUES (?,?,?,?,?,?)
           ON CONFLICT(code) DO UPDATE SET expires_at=excluded.expires_at,
             max_discount=excluded.max_discount,
             auto_pause_after_use=excluded.auto_pause_after_use,
             show_on_website=excluded.show_on_website,
             usage_limit=excluded.usage_limit`,
        ).bind(
          code,
          String(body.expiresAt || "") || null,
          maxDiscount,
          body.autoPauseAfterUse ? 1 : 0,
          showOnWebsite,
          usageLimit,
        ),
      ]);
      await activity(db, session.username, "COUPON_CREATE", code);
      return Response.json({ ok: true, code });
    }
    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Save nahi hua. Duplicate ID ya invalid data check karo." },
      { status: 409 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await adminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const action = String(body.action || "");
  const db = await ensureControlTables();
  if (action === "order") {
    const orderCode = String(body.orderCode);
    const status = String(body.status);
    const updated = await db
      .prepare("UPDATE market_orders SET status=? WHERE order_code=?")
      .bind(status, orderCode)
      .run();
    if (updated.meta.changes)
      await db
        .prepare(
          "INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) VALUES (?,?,?,?,?)",
        )
        .bind(orderCode, status, "ADMIN", session.username, "Admin status update")
        .run();
  } else if (action === "assignRider") {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const orderCode = String(body.orderCode);
    await db
      .prepare(
        `INSERT INTO market_delivery_assignments (order_code,rider_id,status,delivery_fee,delivery_otp)
         VALUES (?,?,'ASSIGNED',20,?)
         ON CONFLICT(order_code) DO UPDATE SET rider_id=excluded.rider_id,status='ASSIGNED',delivery_fee=20,delivery_otp=excluded.delivery_otp`,
      )
      .bind(orderCode, Number(body.riderId), otp)
      .run();
    const markedReady = await db
      .prepare(
        "UPDATE market_orders SET status='READY_FOR_PICKUP' WHERE order_code=? AND status IN ('CONFIRMED','PREPARING','PACKING','READY_FOR_PICKUP')",
      )
      .bind(orderCode)
      .run();
    if (markedReady.meta.changes)
      await db
        .prepare(
          "INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) VALUES (?,'READY_FOR_PICKUP','ADMIN',?,'Rider assigned')",
        )
        .bind(orderCode, session.username)
        .run();
  } else if (action === "shop") {
    const storeId = Number(body.storeId);
    if (!Number.isInteger(storeId) || storeId < 1)
      return Response.json({ error: "Valid shop required" }, { status: 400 });
    const present = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
    const current = await db
      .prepare(
        `SELECT s.id,s.name,s.description,s.address,s.image,s.is_open isOpen,
                coalesce(ss.section_key,p.vertical,s.type) vertical,
                op.opening_time openingTime,op.closing_time closingTime
         FROM market_stores s
         LEFT JOIN market_store_sections ss ON ss.store_id=s.id
         LEFT JOIN market_store_profiles p ON p.store_id=s.id
         LEFT JOIN market_store_operations op ON op.store_id=s.id
         WHERE s.id=?`,
      )
      .bind(storeId)
      .first<{
        id: number;
        name: string;
        description: string;
        address: string;
        image: string;
        isOpen: number;
        vertical: string;
        openingTime: string | null;
        closingTime: string | null;
      }>();
    if (!current)
      return Response.json({ error: "Shop nahi mili" }, { status: 404 });
    const hasDetails = [
      "name",
      "vertical",
      "address",
      "description",
      "openingTime",
      "closingTime",
      "image",
    ].some(present);
    const isOpen = present("isOpen") ? (body.isOpen ? 1 : 0) : current.isOpen ? 1 : 0;
    if (!hasDetails) {
      await db
        .prepare("UPDATE market_stores SET is_open=? WHERE id=?")
        .bind(isOpen, storeId)
        .run();
      return Response.json({ ok: true });
    }
    const name = present("name") ? String(body.name || "").trim() : current.name;
    const vertical = present("vertical")
      ? sectionKey(body.vertical) || current.vertical || "FOOD"
      : current.vertical || "FOOD";
    const address = present("address")
      ? String(body.address || "").trim()
      : current.address || "Lala Bazar";
    const description = present("description")
      ? String(body.description || "").trim()
      : current.description || "";
    const image = present("image")
      ? String(body.image || "")
      : current.image || "/images/hero-food-collage.png";
    const openingTime = present("openingTime")
      ? String(body.openingTime || "09:00")
      : current.openingTime || "09:00";
    const closingTime = present("closingTime")
      ? String(body.closingTime || "22:00")
      : current.closingTime || "22:00";
    const section = await db
      .prepare("SELECT key FROM market_sections WHERE key=? AND is_active=1")
      .bind(vertical)
      .first();
    if (name.length < 2 || address.length < 2)
      return Response.json({ error: "Valid shop name aur address required" }, { status: 400 });
    if (!section)
      return Response.json({ error: "Valid active section select karo" }, { status: 400 });
    if (!/^\d{2}:\d{2}$/.test(openingTime) || !/^\d{2}:\d{2}$/.test(closingTime))
      return Response.json({ error: "Valid opening aur closing time required" }, { status: 400 });
    if (image.length > 1_500_000)
      return Response.json({ error: "Shop photo bahut large hai" }, { status: 400 });
    const baseType = vertical === "FOOD" ? "FOOD" : "GROCERY";
    const legacyVertical = ["FOOD", "GROCERY", "ELECTRONICS"].includes(vertical)
      ? vertical
      : baseType;
    await db.batch([
      db
        .prepare(
          `UPDATE market_stores
           SET name=?,type=?,description=?,address=?,image=?,is_open=?
           WHERE id=?`,
        )
        .bind(name, baseType, description, address, image, isOpen, storeId),
      db
        .prepare(
          `INSERT INTO market_store_profiles (store_id,vertical) VALUES (?,?)
           ON CONFLICT(store_id) DO UPDATE SET vertical=excluded.vertical,
             updated_at=CURRENT_TIMESTAMP`,
        )
        .bind(storeId, legacyVertical),
      db
        .prepare(
          `INSERT INTO market_store_sections (store_id,section_key) VALUES (?,?)
           ON CONFLICT(store_id) DO UPDATE SET section_key=excluded.section_key,
             updated_at=CURRENT_TIMESTAMP`,
        )
        .bind(storeId, vertical),
      db
        .prepare(
          `INSERT INTO market_store_operations (store_id,opening_time,closing_time)
           VALUES (?,?,?)
           ON CONFLICT(store_id) DO UPDATE SET opening_time=excluded.opening_time,
             closing_time=excluded.closing_time,updated_at=CURRENT_TIMESTAMP`,
        )
        .bind(storeId, openingTime, closingTime),
    ]);
  } else if (action === "item") {
    const current = await db
      .prepare(
        `SELECT i.id,i.store_id storeId,i.name,i.description,i.category,i.subcategory,
                i.food_type foodType,i.image,i.is_active isActive,v.label,v.unit,
                v.unit_value unitValue,v.price,v.discount_price discountPrice,
                v.discount_percent discountPercent,
                v.stock_quantity stockQuantity
         FROM market_variants v JOIN market_items i ON i.id=v.item_id WHERE v.id=?`,
      )
      .bind(Number(body.variantId))
      .first<Record<string, unknown>>();
    if (!current)
      return Response.json({ error: "Item not found" }, { status: 404 });
    const present = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
    const name = present("name") ? String(body.name || "").trim() : String(current.name);
    const storeId = present("storeId") ? Number(body.storeId) : Number(current.storeId);
    const price = present("price") ? Number(body.price) : Number(current.price);
    let discountPrice: number;
    let discountPercent: number;
    if (present("discountPrice")) {
      discountPrice = clampOfferPrice(price, body.discountPrice);
      discountPercent = discountPercentFromOffer(price, discountPrice);
    } else {
      discountPercent = present("discountPercent")
        ? Math.floor(Number(body.discountPercent))
        : Number(current.discountPercent || 0);
      discountPrice = discountPercent > 0
        ? discountedPrice(price, discountPercent)
        : present("discountPercent")
          ? price
          : clampOfferPrice(price, current.discountPrice ?? price);
    }
    const stockQuantity = present("stockQuantity")
      ? Number(body.stockQuantity)
      : Number(current.stockQuantity);
    const unitValue = present("unitValue") ? Number(body.unitValue) : Number(current.unitValue);
    const isActive = present("isActive") ? (body.isActive ? 1 : 0) : Number(current.isActive);
    if (!storeId || name.length < 2 || !Number.isFinite(price) || price < 0 || !Number.isFinite(discountPrice) || discountPrice < 0 || discountPrice > price || stockQuantity < 0 || unitValue <= 0 || !Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100)
      return Response.json({ error: "Item details valid nahi hain" }, { status: 400 });
    await db.batch([
      db
        .prepare(
          `UPDATE market_items SET store_id=?,name=?,description=?,category=?,subcategory=?,
                  image=?,food_type=?,is_active=? WHERE id=?`,
        )
        .bind(
          storeId,
          name,
          present("description") ? String(body.description || "") : String(current.description || ""),
          present("category") ? String(body.category || "General") : String(current.category),
          present("subcategory") ? String(body.subcategory || "") : String(current.subcategory || ""),
          present("image") ? String(body.image || "") : String(current.image || ""),
          present("foodType") ? String(body.foodType || "VEG") : String(current.foodType),
          isActive,
          Number(current.id),
        ),
      db
        .prepare(
          `UPDATE market_variants SET label=?,unit=?,unit_value=?,price=?,discount_price=?,
                  discount_percent=?,stock_quantity=?,is_active=? WHERE id=?`,
        )
        .bind(
          present("label") ? String(body.label || "1 pack") : String(current.label),
          present("unit") ? String(body.unit || "PIECE") : String(current.unit),
          unitValue,
          price,
          discountPrice,
          discountPercent,
          stockQuantity,
          isActive,
          Number(body.variantId),
        ),
    ]);
  } else if (action === "section") {
    const key = sectionKey(body.key);
    const current = await db
      .prepare("SELECT key,name FROM market_sections WHERE key=?")
      .bind(key)
      .first<{ key: string; name: string }>();
    if (!current)
      return Response.json({ error: "Section nahi mila" }, { status: 404 });
    const name = String(body.name || current.name).trim();
    const description = String(body.description || "").trim();
    const image = String(body.image || "");
    const icon = String(body.icon || "▦").trim().slice(0, 4) || "▦";
    const sortOrder = Math.floor(Number(body.sortOrder || 0));
    if (
      name.length < 2 ||
      name.length > 40 ||
      image.length > 1_500_000 ||
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      sortOrder > 999
    )
      return Response.json({ error: "Valid section details required" }, { status: 400 });
    await db
      .prepare(
        `UPDATE market_sections SET name=?,description=?,image=?,icon=?,
         is_active=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE key=?`,
      )
      .bind(name, description, image, icon, body.isActive ? 1 : 0, sortOrder, key)
      .run();
    const minOrder=Math.max(0,Math.floor(Number(body.minOrder||0)));
    await db.prepare("INSERT INTO market_settings (key,value,updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP").bind(`minimum_order_${key}`,String(minOrder)).run();
    const deliveryCharge=Math.max(0,Math.floor(Number(body.deliveryCharge||0)));
    await db.prepare("INSERT INTO market_settings (key,value,updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP").bind(`delivery_charge_${key}`,String(deliveryCharge)).run();
  } else if (action === "payment") {
    await db
      .prepare(
        "UPDATE market_transactions SET status=?,reference=? WHERE order_code=? AND type='PAYMENT'",
      )
      .bind(
        String(body.status || "VERIFIED"),
        String(body.reference || "ADMIN VERIFIED"),
        String(body.orderCode),
      )
      .run();
  } else if (action === "payout") {
    const payoutId = Number(body.payoutId);
    const payoutAction = String(body.payoutAction || "APPROVE").toUpperCase();
    const payout = await db
      .prepare(
        `SELECT p.id,p.amount,p.status,p.upi_id upiId,r.name riderName
         FROM market_payouts p JOIN market_riders r ON r.id=p.payee_id
         WHERE p.id=? AND p.payee_type='RIDER'`,
      )
      .bind(payoutId)
      .first<{
        id: number;
        amount: number;
        status: string;
        upiId: string;
        riderName: string;
      }>();
    if (!payout)
      return Response.json({ error: "Withdrawal request nahi mili" }, { status: 404 });
    if (payoutAction === "APPROVE") {
      if (payout.status !== "PENDING")
        return Response.json({ error: "Request already processed hai" }, { status: 409 });
      await db.batch([
        db
          .prepare(
            "UPDATE market_payouts SET status='APPROVED',reference='ADMIN APPROVED' WHERE id=? AND status='PENDING'",
          )
          .bind(payoutId),
        db
          .prepare(
            "INSERT INTO market_admin_notifications (type,title,message) VALUES ('PAYOUT','Withdrawal approved',?)",
          )
          .bind(`${payout.riderName} ka ₹${payout.amount} withdrawal approved`),
      ]);
    } else if (payoutAction === "PAID") {
      if (payout.status !== "APPROVED")
        return Response.json({ error: "Pehle request Accept karo" }, { status: 409 });
      await db.batch([
        db
          .prepare(
            "UPDATE market_payouts SET status='PAID',reference=?,completed_at=CURRENT_TIMESTAMP WHERE id=? AND status='APPROVED'",
          )
          .bind(String(body.reference || "ADMIN UPI PAID"), payoutId),
        db
          .prepare(
            "INSERT INTO market_admin_notifications (type,title,message) VALUES ('PAYOUT','Withdrawal paid',?)",
          )
          .bind(`${payout.riderName} ko ₹${payout.amount} paid`),
      ]);
    } else {
      return Response.json({ error: "Invalid payout action" }, { status: 400 });
    }
  } else if (action === "category") {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1)
      return Response.json({ error: "Valid category required" }, { status: 400 });
    const current = await db
      .prepare(
        "SELECT id,name,vertical FROM market_categories WHERE id=?",
      )
      .bind(id)
      .first<{ id: number; name: string; vertical: string }>();
    if (!current)
      return Response.json({ error: "Category nahi mili" }, { status: 404 });
    const currentIsAll =
      current.name === "All" || current.name.startsWith("__ALL__:");
    const currentDisplayName = currentIsAll ? "All" : current.name;
    const name = String(body.name || currentDisplayName).trim();
    const vertical = sectionKey(body.vertical) || current.vertical;
    const section = await db
      .prepare("SELECT key FROM market_sections WHERE key=?")
      .bind(vertical)
      .first();
    const image = String(body.image || "");
    const sortOrder = Number(body.sortOrder || 0);
    if (currentIsAll && name.toLowerCase() !== "all")
      return Response.json(
        { error: "All category ka naam change nahi hoga" },
        { status: 400 },
      );
    if (!currentIsAll && name.toLowerCase() === "all")
      return Response.json(
        { error: "All photo ke liye dedicated All card use karo" },
        { status: 400 },
      );
    const storedName = currentIsAll ? `__ALL__:${vertical}` : name;
    if (
      name.length < 2 ||
      name.length > 60 ||
      image.length > 1_500_000 ||
      !section ||
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      sortOrder > 999
    )
      return Response.json(
        { error: "Valid category details required" },
        { status: 400 },
      );
    const duplicate = await db
      .prepare("SELECT id FROM market_categories WHERE name=? AND id<>?")
      .bind(storedName, id)
      .first();
    if (duplicate)
      return Response.json(
        { error: "Is naam ki category pehle se hai" },
        { status: 409 },
      );
    await db.batch([
      db
        .prepare(
          `UPDATE market_categories SET name=?,image=?,is_active=?,sort_order=?,vertical=?
           WHERE id=?`,
        )
        .bind(storedName, image, body.isActive ? 1 : 0, sortOrder, vertical, id),
      db
        .prepare(
          `UPDATE market_items SET category=? WHERE category=? AND store_id IN (
             SELECT s.id FROM market_stores s
             LEFT JOIN market_store_profiles p ON p.store_id=s.id
             WHERE coalesce(p.vertical,s.type)=?
           )`,
        )
        .bind(name, current.name, current.vertical),
    ]);
  } else if (action === "account") {
    const username = String(body.username || "").trim().toLowerCase();
    const current = await db
      .prepare(
        "SELECT username,role,panel_type panelType,is_active isActive FROM market_panel_accounts WHERE username=?",
      )
      .bind(username)
      .first<{
        username: string;
        role: string;
        panelType: string;
        isActive: number;
      }>();
    if (!current)
      return Response.json({ error: "Panel user nahi mila" }, { status: 404 });
    if (current.role === "SUPER_ADMIN")
      return Response.json({ error: "Owner account yahan edit nahi hoga" }, { status: 409 });
    const requestedPanelType = String(body.panelType || current.panelType).toUpperCase();
    const panelType = ["RESTAURANT", "GROCERY", "ELECTRONICS", "DELIVERY"].includes(requestedPanelType)
      ? requestedPanelType
      : current.panelType;
    const role = panelType === "DELIVERY" ? "RIDER" : "RESTAURANT";
    const requestedStoreId = Number(body.storeId);
    const requestedRiderId = Number(body.riderId);
    const storeId =
      panelType === "DELIVERY" || !Number.isInteger(requestedStoreId) || requestedStoreId < 1
        ? null
        : requestedStoreId;
    const riderId =
      panelType !== "DELIVERY" || !Number.isInteger(requestedRiderId) || requestedRiderId < 1
        ? null
        : requestedRiderId;
    if (storeId) {
      const assignedStore = await db
        .prepare(
          `SELECT coalesce(ss.section_key,p.vertical,s.type) vertical
           FROM market_stores s
           LEFT JOIN market_store_sections ss ON ss.store_id=s.id
           LEFT JOIN market_store_profiles p ON p.store_id=s.id
           WHERE s.id=?`,
        )
        .bind(storeId)
        .first<{ vertical: string }>();
      const expected = panelType === "RESTAURANT" ? "FOOD" : panelType;
      if (!assignedStore || assignedStore.vertical !== expected)
        return Response.json({ error: "Selected shop panel type se match nahi karta" }, { status: 400 });
    }
    if (riderId) {
      const rider = await db
        .prepare("SELECT id FROM market_riders WHERE id=?")
        .bind(riderId)
        .first();
      if (!rider)
        return Response.json({ error: "Selected rider nahi mila" }, { status: 400 });
    }
    const isActive =
      body.isActive === undefined ? current.isActive : body.isActive ? 1 : 0;
    await db
      .prepare(
        `UPDATE market_panel_accounts
         SET role=?,panel_type=?,store_id=?,rider_id=?,is_active=?
         WHERE username=?`,
      )
      .bind(role, panelType, storeId, riderId, isActive, username)
      .run();
  } else if (action === "notificationRead") {
    await db
      .prepare("UPDATE market_admin_notifications SET is_read=1 WHERE id=?")
      .bind(Number(body.id))
      .run();
  } else if (action === "couponOrder") {
    const codes = Array.isArray(body.codes)
      ? body.codes.map((value) => String(value).trim().toUpperCase())
      : [];
    const uniqueCodes = [...new Set(codes)];
    if (
      !codes.length ||
      codes.length > 500 ||
      uniqueCodes.length !== codes.length ||
      codes.some((code) => !/^[A-Z0-9]{4,20}$/.test(code))
    )
      return Response.json({ error: "Valid coupon order required" }, { status: 400 });
    const placeholders = codes.map(() => "?").join(",");
    const existing = await db
      .prepare(
        `SELECT count(*) count FROM market_promotions WHERE upper(code) IN (${placeholders})`,
      )
      .bind(...codes)
      .first<{ count: number }>();
    const total = await db
      .prepare("SELECT count(*) count FROM market_promotions")
      .first<{ count: number }>();
    if (
      Number(existing?.count || 0) !== codes.length ||
      Number(total?.count || 0) !== codes.length
    )
      return Response.json({ error: "Coupon list changed—refresh and retry" }, { status: 409 });
    await db.batch(
      codes.map((code, sortOrder) =>
        db
          .prepare("UPDATE market_promotions SET sort_order=? WHERE upper(code)=?")
          .bind(sortOrder, code),
      ),
    );
  } else if (action === "coupon") {
    const code = String(body.code || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{4,20}$/.test(code))
      return Response.json({ error: "Valid coupon code required" }, { status: 400 });
    if (body.title !== undefined) {
      const title = String(body.title || "").trim();
      const discountType = body.discountType === "PERCENT" ? "PERCENT" : "FLAT";
      const discountValue = Number(body.discountValue);
      const minOrder = Number(body.minOrder || 0);
      const maxDiscount = Number(body.maxDiscount || 0);
      const usageLimit = Number(body.usageLimit || 0);
      const expiresAt = String(body.expiresAt || "");
      const showOnWebsite = body.showOnWebsite === undefined || body.showOnWebsite ? 1 : 0;
      if (
        title.length < 2 ||
        !Number.isFinite(discountValue) ||
        discountValue <= 0 ||
        (discountType === "PERCENT" && discountValue > 100) ||
        !Number.isFinite(minOrder) ||
        minOrder < 0 ||
        !Number.isFinite(maxDiscount) ||
        maxDiscount < 0 ||
        !Number.isInteger(usageLimit) ||
        usageLimit < 0 ||
        (expiresAt && !/^\d{4}-\d{2}-\d{2}$/.test(expiresAt))
      )
        return Response.json({ error: "Valid coupon details required" }, { status: 400 });
      const existing = await db
        .prepare("SELECT code FROM market_promotions WHERE code=?")
        .bind(code)
        .first();
      if (!existing)
        return Response.json({ error: "Coupon nahi mila" }, { status: 404 });
      await db.batch([
        db.prepare(
          `UPDATE market_promotions
           SET title=?,discount_type=?,discount_value=?,min_order=?
           WHERE code=?`,
        ).bind(title, discountType, discountValue, minOrder, code),
        db.prepare(
          `INSERT INTO market_promotion_rules
           (code,expires_at,max_discount,auto_pause_after_use,show_on_website,usage_limit)
           VALUES (?,?,?,?,?,?)
           ON CONFLICT(code) DO UPDATE SET expires_at=excluded.expires_at,
             max_discount=excluded.max_discount,
             auto_pause_after_use=excluded.auto_pause_after_use,
             show_on_website=excluded.show_on_website,
             usage_limit=excluded.usage_limit`,
        ).bind(
          code,
          expiresAt || null,
          maxDiscount,
          body.autoPauseAfterUse ? 1 : 0,
          showOnWebsite,
          usageLimit,
        ),
      ]);
    } else {
      await db
        .prepare("UPDATE market_promotions SET is_active=? WHERE code=?")
        .bind(body.isActive ? 1 : 0, code)
        .run();
    }
  } else if (action === "rewardOffer") {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1)
      return Response.json({ error: "Valid offer required" }, { status: 400 });
    if (body.title !== undefined) {
      const title = String(body.title || "").trim();
      const description = String(body.description || "").trim();
      const qualifyingOrders = Number(body.qualifyingOrders);
      const windowDays = Number(body.windowDays);
      const minOrder = Number(body.minOrder || 0);
      if (
        title.length < 3 ||
        description.length < 5 ||
        !Number.isInteger(qualifyingOrders) ||
        qualifyingOrders < 1 ||
        qualifyingOrders > 50 ||
        !Number.isInteger(windowDays) ||
        windowDays < 1 ||
        windowDays > 365 ||
        !Number.isFinite(minOrder) ||
        minOrder < 0
      )
        return Response.json(
          { error: "Valid automatic offer details required" },
          { status: 400 },
        );
      const updated = await db
        .prepare(
          `UPDATE market_reward_offers SET title=?,description=?,qualifying_orders=?,
           window_days=?,reward_type='FREE_DELIVERY',reward_value=0,min_order=?,
           updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        )
        .bind(title, description, qualifyingOrders, windowDays, minOrder, id)
        .run();
      if (!updated.meta.changes)
        return Response.json({ error: "Offer nahi mila" }, { status: 404 });
    } else {
      await db
        .prepare(
          "UPDATE market_reward_offers SET is_active=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
        )
        .bind(body.isActive ? 1 : 0, id)
        .run();
    }
  } else if (action === "content") {
    const key = String(body.key || "").trim();
    if (!/^[a-z0-9_]{2,50}$/.test(key))
      return Response.json({ error: "Invalid content section" }, { status: 400 });
    await db.prepare(
      `INSERT INTO market_content (key,title,body,image,updated_at)
       VALUES (?,?,?,?,CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET title=excluded.title,body=excluded.body,
         image=excluded.image,updated_at=CURRENT_TIMESTAMP`,
    ).bind(key,String(body.title || ""),String(body.body || ""),String(body.image || "")).run();
  } else if (action === "website") {
    const allowed = ["website_name","theme_primary","theme_accent","theme_background"];
    const entries = Object.entries(body.values as Record<string, unknown>).filter(([key]) => allowed.includes(key));
    await db.batch(entries.map(([key,value]) => db.prepare(
      "INSERT INTO market_settings (key,value,updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP",
    ).bind(key,String(value))));
  } else if (action === "settings") {
    const allowed = [
      "upi_id",
      "delivery_charge",
      "support_number",
      "maintenance_mode",
      "order_accept_mode",
    ];
    const entries = Object.entries(body.values as Record<string, unknown>).filter(
      ([key]) => allowed.includes(key),
    );
    await db.batch(
      entries.map(([key, value]) =>
        db
          .prepare(
            "INSERT INTO market_settings (key,value,updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP",
          )
          .bind(key, String(value)),
      ),
    );
  } else {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }
  await activity(
    db,
    session.username,
    action.toUpperCase(),
    String(
      body.orderCode ||
        body.storeId ||
        body.variantId ||
        body.id ||
        body.code ||
        body.key ||
        "",
    ),
  );
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await adminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const db = await ensureControlTables();
  if (body.action === "account") {
    const username = String(body.username);
    if (username === session.username)
      return Response.json(
        { error: "Current owner account delete nahi kar sakte" },
        { status: 409 },
      );
    await db.batch([
      db
        .prepare("DELETE FROM market_panel_sessions WHERE username=?")
        .bind(username),
      db.prepare("DELETE FROM market_panel_accounts WHERE username=?").bind(username),
    ]);
  } else if (body.action === "item") {
    const itemId = Number(body.itemId);
    await db.batch([
      db.prepare("DELETE FROM market_item_addons WHERE item_id=?").bind(itemId),
      db.prepare("DELETE FROM market_item_flags WHERE item_id=?").bind(itemId),
      db.prepare("DELETE FROM market_variants WHERE item_id=?").bind(itemId),
      db.prepare("DELETE FROM market_items WHERE id=?").bind(itemId),
    ]);
  } else if (body.action === "category") {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1)
      return Response.json({ error: "Valid category required" }, { status: 400 });
    await db.prepare("DELETE FROM market_categories WHERE id=?").bind(id).run();
    await activity(db, session.username, "CATEGORY_DELETE", String(id));
  } else if (body.action === "section") {
    const key = sectionKey(body.key);
    if (["FOOD", "GROCERY", "ELECTRONICS"].includes(key))
      return Response.json(
        { error: "Default section delete nahi hoga; visibility off karo." },
        { status: 409 },
      );
    const used = await db
      .prepare(
        `SELECT
         (SELECT count(*) FROM market_store_sections WHERE section_key=?) +
         (SELECT count(*) FROM market_categories WHERE vertical=?) count`,
      )
      .bind(key, key)
      .first<{ count: number }>();
    if (used?.count)
      return Response.json(
        { error: "Is section mein shop/category hai; pehle unko move ya delete karo." },
        { status: 409 },
      );
    await db.prepare("DELETE FROM market_sections WHERE key=?").bind(key).run();
    await activity(db, session.username, "SECTION_DELETE", key);
  } else if (body.action === "coupon") {
    const code = String(body.code || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{4,20}$/.test(code))
      return Response.json({ error: "Valid coupon code required" }, { status: 400 });
    await db.batch([
      db.prepare("DELETE FROM market_single_coupon_claims WHERE coupon_code=?").bind(code),
      db.prepare("DELETE FROM market_coupon_claims WHERE coupon_code=?").bind(code),
      db.prepare("DELETE FROM market_promotion_rules WHERE code=?").bind(code),
      db.prepare("DELETE FROM market_promotions WHERE code=?").bind(code),
    ]);
    await activity(db, session.username, "COUPON_DELETE", code);
  } else if (body.action === "rewardOffer") {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1)
      return Response.json({ error: "Valid offer required" }, { status: 400 });
    await db.batch([
      db.prepare("DELETE FROM market_reward_claims WHERE offer_id=?").bind(id),
      db.prepare("DELETE FROM market_reward_offers WHERE id=?").bind(id),
    ]);
    await activity(db, session.username, "REWARD_OFFER_DELETE", String(id));
  } else if (body.action === "shop") {
    const storeId = Number(body.storeId);
    const store = await db
      .prepare("SELECT id,name FROM market_stores WHERE id=?")
      .bind(storeId)
      .first<{ id: number; name: string }>();
    if (!store)
      return Response.json({ error: "Shop nahi mili" }, { status: 404 });
    await db.batch([
      db.prepare("DELETE FROM market_panel_sessions WHERE username IN (SELECT username FROM market_panel_accounts WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_panel_accounts WHERE store_id=?").bind(storeId),
      db.prepare(`UPDATE market_riders SET cod_collection=max(cod_collection-coalesce((
        SELECT sum(o.total) FROM market_delivery_assignments a
        JOIN market_orders o ON o.order_code=a.order_code
        WHERE a.rider_id=market_riders.id AND o.store_id=? AND o.payment_method='COD'
      ),0),0)`).bind(storeId),
      db.prepare(`UPDATE market_promotions SET uses=max(uses-(
        SELECT count(*) FROM market_coupon_claims c
        WHERE c.coupon_code=market_promotions.code AND c.order_code IN
          (SELECT order_code FROM market_orders WHERE store_id=?)),0)`).bind(storeId),
      db.prepare(`UPDATE market_reward_offers SET uses=max(uses-(
        SELECT count(*) FROM market_reward_claims c
        WHERE c.offer_id=market_reward_offers.id AND c.order_code IN
          (SELECT order_code FROM market_orders WHERE store_id=?)),0)`).bind(storeId),
      db.prepare("DELETE FROM market_admin_notifications WHERE order_code IN (SELECT order_code FROM market_orders WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_rider_reviews WHERE order_code IN (SELECT order_code FROM market_orders WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_reviews WHERE store_id=? OR order_code IN (SELECT order_code FROM market_orders WHERE store_id=?)").bind(storeId, storeId),
      db.prepare("DELETE FROM market_delivery_assignments WHERE order_code IN (SELECT order_code FROM market_orders WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_transactions WHERE order_code IN (SELECT order_code FROM market_orders WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_single_coupon_claims WHERE order_code IN (SELECT order_code FROM market_orders WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_coupon_claims WHERE order_code IN (SELECT order_code FROM market_orders WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_reward_claims WHERE order_code IN (SELECT order_code FROM market_orders WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_order_items WHERE order_code IN (SELECT order_code FROM market_orders WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_orders WHERE store_id=?").bind(storeId),
      db.prepare("DELETE FROM market_item_addons WHERE item_id IN (SELECT id FROM market_items WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_item_flags WHERE item_id IN (SELECT id FROM market_items WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_variants WHERE item_id IN (SELECT id FROM market_items WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_items WHERE store_id=?").bind(storeId),
      db.prepare("DELETE FROM market_promotions WHERE code IN (SELECT code FROM market_promotion_rules WHERE store_id=?)").bind(storeId),
      db.prepare("DELETE FROM market_promotion_rules WHERE store_id=?").bind(storeId),
      db.prepare("DELETE FROM market_store_controls WHERE store_id=?").bind(storeId),
      db.prepare("DELETE FROM market_store_operations WHERE store_id=?").bind(storeId),
      db.prepare("DELETE FROM market_store_profiles WHERE store_id=?").bind(storeId),
      db.prepare("DELETE FROM market_store_sections WHERE store_id=?").bind(storeId),
      db.prepare("DELETE FROM market_stores WHERE id=?").bind(storeId),
    ]);
    await activity(db, session.username, "SHOP_CASCADE_DELETE", `${storeId}:${store.name}`);
  } else {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }
  return Response.json({ ok: true });
}
