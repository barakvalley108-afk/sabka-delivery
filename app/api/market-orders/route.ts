import { ensureControlTables } from "../../../db/control-store";
import { getRewardProgress } from "../../reward-offers";

type Payload = {
  mobile?: string;
  customerName?: string;
  storeId?: number;
  address?: string;
  area?: string;
  paymentMethod?: string;
  couponCode?: string;
  rewardOfferId?: number;
  items?: Record<string, number>;
};

type StoreRow = { id: number; vertical: string };
type VariantRow = {
  id: number;
  label: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  name: string;
  store_id: number;
};

const makeOrderCode = (index: number) =>
  `SD-${Date.now().toString().slice(-7)}-${Math.floor(10 + Math.random() * 90)}${index ? `-${index + 1}` : ""}`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const mobile = body.mobile?.trim() || "";
    const customerName = body.customerName?.trim() || "";
    const address = body.address?.trim() || "";
    const requestedArea = body.area?.trim() || "";
    const couponCode = body.couponCode?.trim().toUpperCase() || "";
    const rewardOfferId = Number(body.rewardOfferId || 0);
    const requested = Object.entries(body.items || {})
      .map(([id, quantity]) => ({ id: Number(id), quantity: Number(quantity) }))
      .filter(
        (entry) =>
          Number.isInteger(entry.id) &&
          Number.isInteger(entry.quantity) &&
          entry.quantity > 0 &&
          entry.quantity <= 20,
      );

    if (
      !/^\d{10}$/.test(mobile) ||
      customerName.length < 2 ||
      address.length < 8 ||
      !requested.length
    ) {
      return Response.json(
        { error: "Valid checkout details required" },
        { status: 400 },
      );
    }

    const db = await ensureControlTables();
    const settings = await db
      .prepare("SELECT key,value FROM market_settings")
      .all<{ key: string; value: string }>();
    const config = Object.fromEntries(
      settings.results.map((entry) => [entry.key, entry.value]),
    );

    if (config.maintenance_mode === "true") {
      return Response.json(
        { error: "Website maintenance chal raha hai. Thodi der baad try karo." },
        { status: 503 },
      );
    }

    const customer = await db
      .prepare(
        "SELECT is_blocked isBlocked FROM market_customer_controls WHERE mobile=?",
      )
      .bind(mobile)
      .first<{ isBlocked: number }>();
    if (customer?.isBlocked) {
      return Response.json(
        { error: "Is customer account se order blocked hai. Support se contact karo." },
        { status: 403 },
      );
    }

    const service = await db
      .prepare(
        requestedArea
          ? "SELECT * FROM market_service_areas WHERE lower(name)=lower(?) AND is_active=1"
          : "SELECT * FROM market_service_areas WHERE is_active=1 ORDER BY CASE WHEN lower(name)='lala bazar' THEN 0 ELSE 1 END,id LIMIT 1",
      )
      .bind(...(requestedArea ? [requestedArea] : []))
      .first<{
        name: string;
        delivery_charge: number;
        min_order: number;
        free_delivery_above: number;
        night_charge: number;
        rain_charge: number;
      }>();
    if (!service) {
      return Response.json(
        { error: "Delivery service area abhi available nahi hai" },
        { status: 400 },
      );
    }

    const placeholders = requested.map(() => "?").join(",");
    const result = await db
      .prepare(
        `SELECT v.id,v.label,v.price,v.discount_price,v.stock_quantity,i.name,i.store_id
         FROM market_variants v
         JOIN market_items i ON i.id=v.item_id
         WHERE v.id IN (${placeholders}) AND v.is_active=1 AND i.is_active=1`,
      )
      .bind(...requested.map((entry) => entry.id))
      .all<VariantRow>();

    if (result.results.length !== requested.length) {
      return Response.json(
        { error: "Cart ke kuch items available nahi hain" },
        { status: 400 },
      );
    }

    const quantities = Object.fromEntries(
      requested.map((entry) => [entry.id, entry.quantity]),
    );
    const unavailable = result.results.find(
      (entry) => entry.stock_quantity < quantities[entry.id],
    );
    if (unavailable) {
      return Response.json(
        { error: `${unavailable.name} out of stock hai` },
        { status: 409 },
      );
    }

    const storeIds = [...new Set(result.results.map((entry) => entry.store_id))];
    const storePlaceholders = storeIds.map(() => "?").join(",");
    const stores = await db
      .prepare(
        `SELECT s.id,coalesce(ss.section_key,sp.vertical,s.type) vertical
         FROM market_stores s
         JOIN market_store_controls c ON c.store_id=s.id
         LEFT JOIN market_store_operations op ON op.store_id=s.id
         LEFT JOIN market_store_sections ss ON ss.store_id=s.id
         LEFT JOIN market_store_profiles sp ON sp.store_id=s.id
         WHERE s.id IN (${storePlaceholders})
           AND s.is_open=1 AND c.approved=1 AND c.blocked=0
           AND (op.store_id IS NULL
             OR (op.opening_time<=op.closing_time AND time('now','+5 hours','+30 minutes') BETWEEN op.opening_time AND op.closing_time)
             OR (op.opening_time>op.closing_time AND (time('now','+5 hours','+30 minutes')>=op.opening_time OR time('now','+5 hours','+30 minutes')<=op.closing_time)))`,
      )
      .bind(...storeIds)
      .all<StoreRow>();

    if (stores.results.length !== storeIds.length) {
      return Response.json(
        { error: "Cart ka koi restaurant abhi order accept nahi kar raha" },
        { status: 409 },
      );
    }

    const verticals = [...new Set(stores.results.map((store) => store.vertical))];
    if (verticals.length > 1) {
      return Response.json(
        { error: "Food, Grocery aur Electronics ek hi checkout me mix nahi kar sakte" },
        { status: 400 },
      );
    }

    const vertical = verticals[0] || "FOOD";
    const subtotal = result.results.reduce(
      (sum, entry) =>
        sum + (entry.discount_price ?? entry.price) * quantities[entry.id],
      0,
    );
    const indiaHour =
      (new Date().getUTCHours() +
        5 +
        (new Date().getUTCMinutes() >= 30 ? 1 : 0)) %
      24;
    const nightExtra = indiaHour >= 22 || indiaHour < 6 ? service.night_charge : 0;
    const rainExtra = config.rain_mode === "true" ? service.rain_charge : 0;
    const configuredDeliveryCharge = Number(
      config[`delivery_charge_${vertical}`] ?? config.delivery_charge,
    );
    const baseDeliveryCharge =
      Number.isFinite(configuredDeliveryCharge) && configuredDeliveryCharge >= 0
        ? configuredDeliveryCharge
        : service.delivery_charge;
    const deliveryFeeBeforeReward =
      (subtotal >= service.free_delivery_above ? 0 : baseDeliveryCharge) +
      nightExtra +
      rainExtra;
    const sectionMinimum = Math.max(
      0,
      Number(config[`minimum_order_${vertical}`] || 0),
    );
    if (subtotal + deliveryFeeBeforeReward < sectionMinimum) {
      return Response.json(
        { error: `${vertical} order ka minimum ₹${sectionMinimum} hona chahiye` },
        { status: 400 },
      );
    }

    const rewardProgress = await getRewardProgress(mobile);
    const appliedReward = rewardProgress.find(
      (offer) =>
        offer.id === rewardOfferId &&
        offer.eligible &&
        offer.rewardType === "FREE_DELIVERY" &&
        subtotal >= offer.minOrder,
    );
    const deliveryFee = appliedReward ? 0 : deliveryFeeBeforeReward;

    let discount = 0;
    let autoPauseCoupon = false;
    if (couponCode) {
      const promo = await db
        .prepare(
          `SELECT p.code,p.discount_type discountType,p.discount_value discountValue,p.min_order minOrder,p.is_active isActive,
                  r.max_discount maxDiscount,r.expires_at expiresAt,r.user_mobile userMobile,r.store_id storeId,
                  r.first_order_only firstOrderOnly,r.auto_pause_after_use autoPauseAfterUse
           FROM market_promotions p
           LEFT JOIN market_promotion_rules r ON r.code=p.code
           WHERE p.code=?`,
        )
        .bind(couponCode)
        .first<{
          code: string;
          discountType: string;
          discountValue: number;
          minOrder: number;
          isActive: number;
          maxDiscount: number;
          expiresAt: string | null;
          userMobile: string | null;
          storeId: number | null;
          firstOrderOnly: number;
          autoPauseAfterUse: number;
        }>();

      if (
        !promo?.isActive ||
        (promo.expiresAt && new Date(`${promo.expiresAt}T23:59:59`) < new Date()) ||
        (promo.userMobile && promo.userMobile !== mobile) ||
        (promo.storeId && (storeIds.length !== 1 || promo.storeId !== storeIds[0]))
      ) {
        return Response.json(
          { error: "Coupon is order ke liye valid nahi hai" },
          { status: 400 },
        );
      }
      if (subtotal < promo.minOrder) {
        return Response.json(
          { error: `Coupon ke liye minimum order ₹${promo.minOrder} hai` },
          { status: 400 },
        );
      }
      const claimed = await db
        .prepare(
          "SELECT id FROM market_coupon_claims WHERE mobile=? AND coupon_code=?",
        )
        .bind(mobile, couponCode)
        .first();
      if (claimed) {
        return Response.json(
          { error: "Ye coupon is mobile number par pehle use ho chuka hai" },
          { status: 409 },
        );
      }
      if (promo.firstOrderOnly) {
        const old = await db
          .prepare("SELECT order_code FROM market_orders WHERE mobile=? LIMIT 1")
          .bind(mobile)
          .first();
        if (old) {
          return Response.json(
            { error: "Ye offer sirf first order ke liye hai" },
            { status: 409 },
          );
        }
      }
      discount =
        promo.discountType === "PERCENT"
          ? Math.floor((subtotal * promo.discountValue) / 100)
          : promo.discountValue;
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
      autoPauseCoupon = !!promo.autoPauseAfterUse;
    }

    const total = Math.max(0, subtotal + deliveryFee - discount);
    const payment = body.paymentMethod === "UPI" ? "UPI" : "COD";
    const initialStatus =
      config.order_accept_mode === "AUTO" ? "CONFIRMED" : "ACCEPTED";
    const area = service.name;

    const grouped = storeIds.map((storeId) => {
      const storeItems = result.results.filter((entry) => entry.store_id === storeId);
      const storeSubtotal = storeItems.reduce(
        (sum, entry) =>
          sum + (entry.discount_price ?? entry.price) * quantities[entry.id],
        0,
      );
      return { storeId, items: storeItems, subtotal: storeSubtotal };
    });

    const orderCodes = grouped.map((_, index) => makeOrderCode(index));
    const statements = result.results.map((entry) =>
      db
        .prepare(
          "UPDATE market_variants SET stock_quantity=stock_quantity-? WHERE id=? AND stock_quantity>=?",
        )
        .bind(quantities[entry.id], entry.id, quantities[entry.id]),
    );

    grouped.forEach((group, index) => {
      const orderCode = orderCodes[index];
      const isPrimary = index === 0;
      const allocatedDeliveryFee = isPrimary ? deliveryFee : 0;
      const allocatedDiscount = isPrimary ? discount : 0;
      const orderTotal = Math.max(
        0,
        group.subtotal + allocatedDeliveryFee - allocatedDiscount,
      );

      statements.push(
        db
          .prepare(
            "INSERT INTO market_orders (order_code,mobile,customer_name,store_id,address,area,payment_method,subtotal,delivery_fee,total,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          )
          .bind(
            orderCode,
            mobile,
            customerName,
            group.storeId,
            address,
            area,
            payment,
            group.subtotal,
            allocatedDeliveryFee,
            orderTotal,
            initialStatus,
          ),
        db
          .prepare(
            "INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) VALUES (?,?,?,?,?)",
          )
          .bind(
            orderCode,
            initialStatus,
            "CUSTOMER",
            mobile,
            storeIds.length > 1 ? "Mixed restaurant checkout" : "Order placed",
          ),
      );

      group.items.forEach((entry) => {
        statements.push(
          db
            .prepare(
              "INSERT INTO market_order_items (order_code,variant_id,item_name,variant_label,unit_price,quantity) VALUES (?,?,?,?,?,?)",
            )
            .bind(
              orderCode,
              entry.id,
              entry.name,
              entry.label,
              entry.discount_price ?? entry.price,
              quantities[entry.id],
            ),
        );
      });

      statements.push(
        db
          .prepare(
            "INSERT INTO market_transactions (order_code,type,method,amount,status,reference) VALUES (?,'PAYMENT',?,?,?,?)",
          )
          .bind(orderCode, payment, orderTotal, "PENDING", ""),
        db
          .prepare(
            "INSERT INTO market_admin_notifications (type,title,message,order_code) VALUES ('ORDER','New order received',?,?)",
          )
          .bind(
            `${customerName} ne ₹${orderTotal} ka ${payment} order place kiya`,
            orderCode,
          ),
      );

      if (payment === "UPI") {
        statements.push(
          db
            .prepare(
              "INSERT INTO market_admin_notifications (type,title,message,order_code) VALUES ('PAYMENT','UPI verification required',?,?)",
            )
            .bind(`₹${orderTotal} UPI payment verify karo`, orderCode),
        );
      }
    });

    statements.push(
      db
        .prepare("INSERT OR IGNORE INTO market_customer_controls (mobile) VALUES (?)")
        .bind(mobile),
    );

    const primaryOrderCode = orderCodes[0];
    if (couponCode) {
      if (autoPauseCoupon) {
        statements.push(
          db
            .prepare(
              "INSERT INTO market_single_coupon_claims (coupon_code,mobile,order_code) VALUES (?,?,?)",
            )
            .bind(couponCode, mobile, primaryOrderCode),
        );
      }
      statements.push(
        db
          .prepare(
            "INSERT INTO market_coupon_claims (mobile,coupon_code,order_code,discount) VALUES (?,?,?,?)",
          )
          .bind(mobile, couponCode, primaryOrderCode, discount),
        db
          .prepare("UPDATE market_promotions SET uses=uses+1 WHERE code=?")
          .bind(couponCode),
        db
          .prepare(
            "UPDATE market_promotions SET is_active=0 WHERE code=? AND EXISTS (SELECT 1 FROM market_promotion_rules r WHERE r.code=? AND r.auto_pause_after_use=1)",
          )
          .bind(couponCode, couponCode),
      );
    }

    if (appliedReward) {
      statements.push(
        db
          .prepare(
            `INSERT INTO market_reward_claims
             (offer_id,mobile,order_code,cycle_number) VALUES (?,?,?,?)`,
          )
          .bind(
            appliedReward.id,
            mobile,
            primaryOrderCode,
            appliedReward.cycleNumber,
          ),
        db
          .prepare("UPDATE market_reward_offers SET uses=uses+1 WHERE id=?")
          .bind(appliedReward.id),
      );
    }

    await db.batch(statements);

    return Response.json(
      {
        order: {
          orderCode: orderCodes.join(", "),
          orderCodes,
          total,
          discount,
          couponCode,
          rewardOffer: appliedReward
            ? { id: appliedReward.id, title: appliedReward.title }
            : null,
          deliveryFee,
          status: initialStatus,
          storeCount: storeIds.length,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Order place nahi hua. Dobara try karo." },
      { status: 500 },
    );
  }
}
