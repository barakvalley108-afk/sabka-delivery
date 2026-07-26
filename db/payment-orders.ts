export const DEFAULT_PAYMENT_TIMEOUT_MINUTES = 15;
const MAX_TIMEOUT_MINUTES = 120;
const DEFAULT_SWEEP_LIMIT = 25;

type PaymentOrder = {
  orderCode: string;
  mobile: string;
  customerName: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string | null;
  createdAt: string;
  total: number;
  estimatedDelivery: string;
};

export type PaymentOrderState = PaymentOrder & {
  confirmed: boolean;
  expiresAt: string | null;
};

const utcMillis = (value: string) =>
  new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`).getTime();

async function paymentTimeoutMinutes(db: D1Database) {
  const setting = await db
    .prepare(
      "SELECT value FROM market_settings WHERE key='payment_timeout_minutes'",
    )
    .first<{ value: string }>();
  const parsed = Number(setting?.value || DEFAULT_PAYMENT_TIMEOUT_MINUTES);
  return Number.isFinite(parsed)
    ? Math.max(1, Math.min(MAX_TIMEOUT_MINUTES, Math.floor(parsed)))
    : DEFAULT_PAYMENT_TIMEOUT_MINUTES;
}

async function readPaymentOrder(
  db: D1Database,
  orderCode: string,
  mobile?: string,
) {
  return db
    .prepare(
      `SELECT o.order_code orderCode,o.mobile,o.customer_name customerName,
              o.status,o.payment_method paymentMethod,o.created_at createdAt,
              o.total,s.eta estimatedDelivery,t.status paymentStatus
       FROM market_orders o
       JOIN market_stores s ON s.id=o.store_id
       LEFT JOIN market_transactions t
         ON t.order_code=o.order_code AND t.type='PAYMENT'
       WHERE o.order_code=? ${mobile ? "AND o.mobile=?" : ""}
       LIMIT 1`,
    )
    .bind(orderCode, ...(mobile ? [mobile] : []))
    .first<PaymentOrder>();
}

export async function cancelPendingPaymentOrder(
  db: D1Database,
  orderCode: string,
  reason = "Online payment verification timed out",
): Promise<boolean> {
  const [lines, couponClaim, rewardClaim] = await db.batch([
    db
      .prepare(
        "SELECT variant_id variantId,quantity FROM market_order_items WHERE order_code=?",
      )
      .bind(orderCode),
    db
      .prepare(
        "SELECT coupon_code couponCode FROM market_coupon_claims WHERE order_code=?",
      )
      .bind(orderCode),
    db
      .prepare(
        "SELECT offer_id offerId FROM market_reward_claims WHERE order_code=?",
      )
      .bind(orderCode),
  ]);

  const updated = await db
    .prepare(
      `UPDATE market_orders SET status='CANCELLED'
       WHERE order_code=? AND status='PAYMENT_PENDING'
         AND payment_method='UPI'
         AND EXISTS (
           SELECT 1 FROM market_transactions
           WHERE order_code=? AND type='PAYMENT' AND status='PENDING'
         )`,
    )
    .bind(orderCode, orderCode)
    .run();

  if (!updated.meta.changes) return false;

  const couponCode = String(
    (couponClaim.results[0] as { couponCode?: string } | undefined)?.couponCode ||
      "",
  );
  const rewardOfferId = Number(
    (rewardClaim.results[0] as { offerId?: number } | undefined)?.offerId || 0,
  );
  const statements = [
    ...(lines.results as Array<{ variantId: number; quantity: number }>).map(
      (line) =>
        db
          .prepare(
            "UPDATE market_variants SET stock_quantity=stock_quantity+? WHERE id=?",
          )
          .bind(line.quantity, line.variantId),
    ),
    db
      .prepare(
        "UPDATE market_transactions SET status='CANCELLED',reference=? WHERE order_code=? AND type='PAYMENT' AND status='PENDING'",
      )
      .bind(reason, orderCode),
    db
      .prepare(
        "INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) VALUES (?,'CANCELLED','SYSTEM','PAYMENT_TIMEOUT',?)",
      )
      .bind(orderCode, reason),
    db
      .prepare("DELETE FROM market_single_coupon_claims WHERE order_code=?")
      .bind(orderCode),
    db
      .prepare("DELETE FROM market_coupon_claims WHERE order_code=?")
      .bind(orderCode),
    db
      .prepare("DELETE FROM market_reward_claims WHERE order_code=?")
      .bind(orderCode),
    ...(couponCode
      ? [
          db
            .prepare(
              "UPDATE market_promotions SET uses=max(uses-1,0) WHERE code=?",
            )
            .bind(couponCode),
        ]
      : []),
    ...(rewardOfferId
      ? [
          db
            .prepare(
              "UPDATE market_reward_offers SET uses=max(uses-1,0) WHERE id=?",
            )
            .bind(rewardOfferId),
        ]
      : []),
  ];
  await db.batch(statements);
  return true;
}

export async function confirmOnlinePayment(
  db: D1Database,
  orderCode: string,
  reference = "ADMIN VERIFIED",
): Promise<PaymentOrderState | null> {
  const order = await readPaymentOrder(db, orderCode);
  if (!order) return null;
  if (
    order.paymentMethod !== "UPI" ||
    order.status !== "PAYMENT_PENDING" ||
    order.paymentStatus !== "PENDING"
  ) {
    return {
      ...order,
      confirmed:
        order.paymentStatus === "PAID" &&
        !["PAYMENT_PENDING", "CANCELLED"].includes(order.status),
      expiresAt: null,
    };
  }

  const updated = await db
    .prepare(
      `UPDATE market_orders SET status='PLACED'
       WHERE order_code=? AND status='PAYMENT_PENDING'
         AND EXISTS (
           SELECT 1 FROM market_transactions
           WHERE order_code=? AND type='PAYMENT' AND status='PENDING'
         )`,
    )
    .bind(orderCode, orderCode)
    .run();
  if (!updated.meta.changes) return readPaymentOrderState(db, orderCode);

  await db.batch([
    db
      .prepare(
        "UPDATE market_transactions SET status='PAID',reference=? WHERE order_code=? AND type='PAYMENT' AND status='PENDING'",
      )
      .bind(reference, orderCode),
    db
      .prepare(
        "INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) VALUES (?,'PLACED','SYSTEM','PAYMENT_VERIFIED','Online payment verified')",
      )
      .bind(orderCode),
    db
      .prepare(
        "INSERT INTO market_admin_notifications (type,title,message,order_code) VALUES ('ORDER','New paid order received',?,?)",
      )
      .bind(
        `${order.customerName} ka ₹${order.total} UPI order paid hai`,
        orderCode,
      ),
    db
      .prepare(
        `UPDATE market_promotions SET is_active=0
         WHERE code=(
           SELECT coupon_code FROM market_coupon_claims WHERE order_code=?
         ) AND EXISTS (
           SELECT 1 FROM market_promotion_rules r
           WHERE r.code=market_promotions.code AND r.auto_pause_after_use=1
         )`,
      )
      .bind(orderCode),
  ]);
  return readPaymentOrderState(db, orderCode);
}

export async function readPaymentOrderState(
  db: D1Database,
  orderCode: string,
  mobile?: string,
): Promise<PaymentOrderState | null> {
  let order = await readPaymentOrder(db, orderCode, mobile);
  if (!order) return null;

  const timeoutMinutes = await paymentTimeoutMinutes(db);
  const expiresAt = new Date(
    utcMillis(order.createdAt) + timeoutMinutes * 60_000,
  );

  if (
    order.status === "PAYMENT_PENDING" &&
    order.paymentStatus === "PENDING" &&
    Date.now() >= expiresAt.getTime()
  ) {
    await cancelPendingPaymentOrder(db, orderCode);
    order = (await readPaymentOrder(db, orderCode, mobile)) || order;
  }

  return {
    ...order,
    confirmed:
      order.paymentStatus === "PAID" &&
      !["PAYMENT_PENDING", "CANCELLED"].includes(order.status),
    expiresAt:
      order.status === "PAYMENT_PENDING" && order.paymentStatus === "PENDING"
        ? expiresAt.toISOString()
        : null,
  };
}

export async function expirePendingPayments(
  db: D1Database,
  limit = DEFAULT_SWEEP_LIMIT,
) {
  const timeoutMinutes = await paymentTimeoutMinutes(db);
  const pending = await db
    .prepare(
      `SELECT o.order_code orderCode
       FROM market_orders o
       JOIN market_transactions t
         ON t.order_code=o.order_code AND t.type='PAYMENT'
       WHERE o.status='PAYMENT_PENDING' AND o.payment_method='UPI'
         AND t.status='PENDING'
         AND o.created_at<=datetime('now','-' || ? || ' minutes')
       ORDER BY o.created_at
       LIMIT ?`,
    )
    .bind(timeoutMinutes, Math.max(1, Math.min(100, Math.floor(limit))))
    .all<{ orderCode: string }>();

  let cancelled = 0;
  for (const row of pending.results) {
    if (await cancelPendingPaymentOrder(db, row.orderCode)) cancelled += 1;
  }
  return cancelled;
}
