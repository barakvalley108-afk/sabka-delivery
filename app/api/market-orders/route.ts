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
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const mobile = body.mobile?.trim() || "",
      customerName = body.customerName?.trim() || "",
      address = body.address?.trim() || "",
      requestedArea = body.area?.trim() || "",
      couponCode = body.couponCode?.trim().toUpperCase() || "",
      rewardOfferId = Number(body.rewardOfferId || 0),
      storeId = Number(body.storeId);
    const requested = Object.entries(body.items || {})
      .map(([id, quantity]) => ({ id: Number(id), quantity: Number(quantity) }))
      .filter(
        (x) =>
          Number.isInteger(x.id) &&
          Number.isInteger(x.quantity) &&
          x.quantity > 0 &&
          x.quantity <= 20,
      );
    if (
      !/^\d{10}$/.test(mobile) ||
      customerName.length < 2 ||
      address.length < 8 ||
      !Number.isInteger(storeId) ||
      !requested.length
    )
      return Response.json(
        { error: "Valid checkout details required" },
        { status: 400 },
      );
    const db = await ensureControlTables();
    const settings = await db
      .prepare("SELECT key,value FROM market_settings")
      .all<{ key: string; value: string }>();
    const config = Object.fromEntries(
      settings.results.map((x) => [x.key, x.value]),
    );
    if (config.maintenance_mode === "true")
      return Response.json(
        {
          error: "Website maintenance chal raha hai. Thodi der baad try karo.",
        },
        { status: 503 },
      );
    const customer = await db
      .prepare(
        "SELECT is_blocked isBlocked FROM market_customer_controls WHERE mobile=?",
      )
      .bind(mobile)
      .first<{ isBlocked: number }>();
    if (customer?.isBlocked)
      return Response.json(
        {
          error:
            "Is customer account se order blocked hai. Support se contact karo.",
        },
        { status: 403 },
      );
    const store = await db
      .prepare(
        `SELECT s.id,coalesce(ss.section_key,sp.vertical,s.type) vertical FROM market_stores s JOIN market_store_controls c ON c.store_id=s.id LEFT JOIN market_store_operations op ON op.store_id=s.id LEFT JOIN market_store_sections ss ON ss.store_id=s.id LEFT JOIN market_store_profiles sp ON sp.store_id=s.id WHERE s.id=? AND s.is_open=1 AND c.approved=1 AND c.blocked=0 AND (op.store_id IS NULL OR (op.opening_time<=op.closing_time AND time('now','+5 hours','+30 minutes') BETWEEN op.opening_time AND op.closing_time) OR (op.opening_time>op.closing_time AND (time('now','+5 hours','+30 minutes')>=op.opening_time OR time('now','+5 hours','+30 minutes')<=op.closing_time)))`,
      )
      .bind(storeId)
      .first<{id:number;vertical:string}>();
    if (!store)
      return Response.json(
        { error: "Restaurant abhi order accept nahi kar raha" },
        { status: 409 },
      );
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
    if (!service)
      return Response.json(
        { error: "Delivery service area abhi available nahi hai" },
        { status: 400 },
      );
    const area = service.name;
    const placeholders = requested.map(() => "?").join(",");
    const result = await db
      .prepare(
        `SELECT v.id,v.label,v.price,v.discount_price,v.stock_quantity,i.name,i.store_id FROM market_variants v JOIN market_items i ON i.id=v.item_id WHERE v.id IN (${placeholders}) AND v.is_active=1 AND i.is_active=1`,
      )
      .bind(...requested.map((x) => x.id))
      .all<{
        id: number;
        label: string;
        price: number;
        discount_price: number | null;
        stock_quantity: number;
        name: string;
        store_id: number;
      }>();
    if (
      result.results.length !== requested.length ||
      result.results.some((x) => x.store_id !== storeId)
    )
      return Response.json(
        { error: "Cart items ek hi store ke hone chahiye" },
        { status: 400 },
      );
    const quantities = Object.fromEntries(
      requested.map((x) => [x.id, x.quantity]),
    );
    const unavailable = result.results.find(
      (x) => x.stock_quantity < quantities[x.id],
    );
    if (unavailable)
      return Response.json(
        { error: `${unavailable.name} out of stock hai` },
        { status: 409 },
      );
    const subtotal = result.results.reduce(
      (sum, x) => sum + (x.discount_price ?? x.price) * quantities[x.id],
      0,
    );
    const indiaHour =
        (new Date().getUTCHours() +
          5 +
          (new Date().getUTCMinutes() >= 30 ? 1 : 0)) %
        24,
      nightExtra = indiaHour >= 22 || indiaHour < 6 ? service.night_charge : 0,
      rainExtra = config.rain_mode === "true" ? service.rain_charge : 0,
      configuredDeliveryCharge = Number(
        config[`delivery_charge_${store.vertical}`] ?? config.delivery_charge,
      ),
      baseDeliveryCharge =
        Number.isFinite(configuredDeliveryCharge) && configuredDeliveryCharge >= 0
          ? configuredDeliveryCharge
          : service.delivery_charge,
      deliveryFeeBeforeReward =
        (subtotal >= service.free_delivery_above ? 0 : baseDeliveryCharge) +
        nightExtra +
        rainExtra;
    const sectionMinimum=Math.max(0,Number(config[`minimum_order_${store.vertical}`]||0));
    if (subtotal + deliveryFeeBeforeReward < sectionMinimum)
      return Response.json(
        {
          error: `${store.vertical} order ka minimum ₹${sectionMinimum} hona chahiye`,
        },
        { status: 400 },
      );
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
          `SELECT p.code,p.discount_type discountType,p.discount_value discountValue,p.min_order minOrder,p.is_active isActive,r.max_discount maxDiscount,r.expires_at expiresAt,r.user_mobile userMobile,r.store_id storeId,r.first_order_only firstOrderOnly,r.auto_pause_after_use autoPauseAfterUse FROM market_promotions p LEFT JOIN market_promotion_rules r ON r.code=p.code WHERE p.code=?`,
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
        (promo.expiresAt &&
          new Date(`${promo.expiresAt}T23:59:59`) < new Date()) ||
        (promo.userMobile && promo.userMobile !== mobile) ||
        (promo.storeId && promo.storeId !== storeId)
      )
        return Response.json(
          { error: "Coupon is order ke liye valid nahi hai" },
          { status: 400 },
        );
      if (subtotal < promo.minOrder)
        return Response.json(
          { error: `Coupon ke liye minimum order ₹${promo.minOrder} hai` },
          { status: 400 },
        );
      const claimed = await db
        .prepare(
          "SELECT id FROM market_coupon_claims WHERE mobile=? AND coupon_code=?",
        )
        .bind(mobile, couponCode)
        .first();
      if (claimed)
        return Response.json(
          { error: "Ye coupon is mobile number par pehle use ho chuka hai" },
          { status: 409 },
        );
      if (promo.firstOrderOnly) {
        const old = await db
          .prepare(
            "SELECT order_code FROM market_orders WHERE mobile=? LIMIT 1",
          )
          .bind(mobile)
          .first();
        if (old)
          return Response.json(
            { error: "Ye offer sirf first order ke liye hai" },
            { status: 409 },
          );
      }
      discount =
        promo.discountType === "PERCENT"
          ? Math.floor((subtotal * promo.discountValue) / 100)
          : promo.discountValue;
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
      autoPauseCoupon = !!promo.autoPauseAfterUse;
    }
    const total = Math.max(0, subtotal + deliveryFee - discount),
      orderCode = `SD-${Date.now().toString().slice(-7)}-${Math.floor(10 + Math.random() * 90)}`,
      payment = body.paymentMethod === "UPI" ? "UPI" : "COD",
      initialStatus =
        config.order_accept_mode === "AUTO" ? "CONFIRMED" : "ACCEPTED";
    const statements = [
      ...result.results.map((x) =>
        db
          .prepare(
            "UPDATE market_variants SET stock_quantity=stock_quantity-? WHERE id=? AND stock_quantity>=?",
          )
          .bind(quantities[x.id], x.id, quantities[x.id]),
      ),
      db
        .prepare(
          "INSERT INTO market_orders (order_code,mobile,customer_name,store_id,address,area,payment_method,subtotal,delivery_fee,total,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        )
        .bind(
          orderCode,
          mobile,
          customerName,
          storeId,
          address,
          area,
          payment,
          subtotal,
          deliveryFee,
          total,
          initialStatus,
        ),
      db
        .prepare(
          "INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) VALUES (?,?,?,?,?)",
        )
        .bind(orderCode, initialStatus, "CUSTOMER", mobile, "Order placed"),
      ...result.results.map((x) =>
        db
          .prepare(
            "INSERT INTO market_order_items (order_code,variant_id,item_name,variant_label,unit_price,quantity) VALUES (?,?,?,?,?,?)",
          )
          .bind(
            orderCode,
            x.id,
            x.name,
            x.label,
            x.discount_price ?? x.price,
            quantities[x.id],
          ),
      ),
      db
        .prepare(
          "INSERT OR IGNORE INTO market_customer_controls (mobile) VALUES (?)",
        )
        .bind(mobile),
      db
        .prepare(
          "INSERT INTO market_transactions (order_code,type,method,amount,status,reference) VALUES (?,'PAYMENT',?,?,?,?)",
        )
        .bind(orderCode, payment, total, "PENDING", ""),
      db
        .prepare(
          "INSERT INTO market_admin_notifications (type,title,message,order_code) VALUES ('ORDER','New order received',?,?)",
        )
        .bind(
          `${customerName} ne ₹${total} ka ${payment} order place kiya`,
          orderCode,
        ),
      ...(payment === "UPI"
        ? [
            db
              .prepare(
                "INSERT INTO market_admin_notifications (type,title,message,order_code) VALUES ('PAYMENT','UPI verification required',?,?)",
              )
              .bind(`₹${total} UPI payment verify karo`, orderCode),
          ]
        : []),
      ...(couponCode
        ? [
            ...(autoPauseCoupon
              ? [
                  db
                    .prepare(
                      "INSERT INTO market_single_coupon_claims (coupon_code,mobile,order_code) VALUES (?,?,?)",
                    )
                    .bind(couponCode, mobile, orderCode),
                ]
              : []),
            db
              .prepare(
                "INSERT INTO market_coupon_claims (mobile,coupon_code,order_code,discount) VALUES (?,?,?,?)",
              )
              .bind(mobile, couponCode, orderCode, discount),
            db
              .prepare("UPDATE market_promotions SET uses=uses+1 WHERE code=?")
              .bind(couponCode),
            db
              .prepare(
                "UPDATE market_promotions SET is_active=0 WHERE code=? AND EXISTS (SELECT 1 FROM market_promotion_rules r WHERE r.code=? AND r.auto_pause_after_use=1)",
              )
              .bind(couponCode, couponCode),
          ]
        : []),
      ...(appliedReward
        ? [
            db
              .prepare(
                `INSERT INTO market_reward_claims
                 (offer_id,mobile,order_code,cycle_number) VALUES (?,?,?,?)`,
              )
              .bind(
                appliedReward.id,
                mobile,
                orderCode,
                appliedReward.cycleNumber,
              ),
            db
              .prepare("UPDATE market_reward_offers SET uses=uses+1 WHERE id=?")
              .bind(appliedReward.id),
          ]
        : []),
    ];
    await db.batch(statements);
    return Response.json(
      {
        order: {
          orderCode,
          total,
          discount,
          couponCode,
          rewardOffer: appliedReward
            ? { id: appliedReward.id, title: appliedReward.title }
            : null,
          deliveryFee,
          status: initialStatus,
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
