import { ensureControlTables } from "../../../../db/control-store";
import { getPanelSession } from "../../../panel-auth";

async function riderAuth() {
  const session = await getPanelSession("RIDER");
  if (!session || session.role !== "RIDER") return { status: "unauthorized" as const };
  const db = await ensureControlTables();
  if (!session.riderId)
    return { status: "unassigned" as const, session, db };
  const rider = await db
    .prepare(
      "SELECT *,upi_id upiId,weekly_payout walletBalance FROM market_riders WHERE id=?",
    )
    .bind(session.riderId)
    .first();
  return rider ? { status: "ok" as const, session, db, rider } : { status: "unassigned" as const, session, db };
}

export async function GET() {
  const auth = await riderAuth();
  if (auth.status === "unauthorized")
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.status === "unassigned")
    return Response.json(
      { error: "Is rider panel user ko abhi rider profile assign nahi hua hai." },
      { status: 409 },
    );
  const { db, rider, session } = auth;
  const [requests, active, history, payouts, walletSummary, todaySummary, orderItems] = await db.batch([
    db
      .prepare(
        `SELECT o.order_code orderCode,o.customer_name customerName,o.mobile phone,
      o.area,o.address,o.subtotal,o.delivery_fee deliveryFee,o.total,o.payment_method paymentMethod,
      o.status orderStatus,
      s.name storeName,s.address storeAddress,s.latitude storeLatitude,s.longitude storeLongitude,
      a.rider_id riderId,a.status assignmentStatus
      FROM market_orders o JOIN market_stores s ON s.id=o.store_id
      LEFT JOIN market_delivery_assignments a ON a.order_code=o.order_code
      WHERE (a.rider_id=? AND a.status IN ('ASSIGNED','ACTIVE') AND o.status NOT IN ('OUT_FOR_DELIVERY','DELIVERED','CANCELLED'))
         OR (o.status='READY_FOR_PICKUP' AND a.order_code IS NULL)
      ORDER BY CASE WHEN o.status='READY_FOR_PICKUP' THEN 0 ELSE 1 END,o.created_at DESC`,
      )
      .bind(session.riderId),
    db
      .prepare(
        `SELECT o.order_code orderCode,o.customer_name customerName,o.mobile phone,o.area,o.address,
      o.subtotal,o.delivery_fee deliveryFee,o.total,o.payment_method paymentMethod,o.status orderStatus,
      s.name storeName,s.address storeAddress,s.latitude storeLatitude,
      s.longitude storeLongitude,a.tip,a.delivery_otp deliveryOtp,a.status assignmentStatus
      FROM market_delivery_assignments a JOIN market_orders o ON o.order_code=a.order_code
      JOIN market_stores s ON s.id=o.store_id
      WHERE a.rider_id=? AND a.status='ACTIVE' AND o.status='OUT_FOR_DELIVERY' LIMIT 1`,
      )
      .bind(session.riderId),
    db
      .prepare(
        `SELECT o.order_code orderCode,o.area,o.total,s.name storeName,
      a.delivery_fee deliveryFee,a.tip,a.delivered_at deliveredAt FROM market_delivery_assignments a
      JOIN market_orders o ON o.order_code=a.order_code JOIN market_stores s ON s.id=o.store_id
      WHERE a.rider_id=? AND a.status='DELIVERED' ORDER BY a.delivered_at DESC LIMIT 80`,
      )
      .bind(session.riderId),
    db
      .prepare(
        `SELECT id,period,amount,status,upi_id upiId,reference,
                created_at createdAt,completed_at completedAt
         FROM market_payouts WHERE payee_type='RIDER' AND payee_id=? ORDER BY id DESC`,
      )
      .bind(session.riderId),
    db
      .prepare(
        `SELECT
           coalesce((SELECT sum(coalesce(a.delivery_fee,20)+coalesce(a.tip,0))
                     FROM market_delivery_assignments a
                     WHERE a.rider_id=? AND a.status='DELIVERED'),0) grossEarnings,
           coalesce((SELECT sum(p.amount) FROM market_payouts p
                     WHERE p.payee_type='RIDER' AND p.payee_id=?
                       AND p.status IN ('PENDING','APPROVED','PAID')),0) withdrawn`,
      )
      .bind(session.riderId, session.riderId),
    db
      .prepare(
        `SELECT count(*) todayOrders,
                coalesce(sum(coalesce(a.delivery_fee,20)+coalesce(a.tip,0)),0) todayEarnings,
                coalesce(sum(CASE WHEN o.payment_method='COD' THEN o.total ELSE 0 END),0) todayCod
         FROM market_delivery_assignments a
         JOIN market_orders o ON o.order_code=a.order_code
         WHERE a.rider_id=? AND a.status='DELIVERED'
           AND date(datetime(a.delivered_at,'+5 hours','+30 minutes'))=
               date(datetime('now','+5 hours','+30 minutes'))`,
      )
      .bind(session.riderId),
    db
      .prepare(
        `WITH rider_orders AS (
           SELECT o.order_code
           FROM market_orders o
           LEFT JOIN market_delivery_assignments a ON a.order_code=o.order_code
           WHERE (a.rider_id=? AND a.status IN ('ASSIGNED','ACTIVE') AND o.status NOT IN ('OUT_FOR_DELIVERY','DELIVERED','CANCELLED'))
              OR (o.status='READY_FOR_PICKUP' AND a.order_code IS NULL)
           UNION
           SELECT o.order_code
           FROM market_delivery_assignments a
           JOIN market_orders o ON o.order_code=a.order_code
           WHERE a.rider_id=? AND a.status='ACTIVE' AND o.status='OUT_FOR_DELIVERY'
         )
         SELECT oi.order_code orderCode,oi.item_name itemName,oi.variant_label variantLabel,
                oi.quantity,oi.unit_price unitPrice
         FROM market_order_items oi
         JOIN rider_orders ro ON ro.order_code=oi.order_code
         ORDER BY oi.id`,
      )
      .bind(session.riderId, session.riderId),
  ]);
  type OrderItem = {
    orderCode: string;
    itemName: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
  };
  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of orderItems.results as OrderItem[]) {
    const list = itemsByOrder.get(item.orderCode) || [];
    list.push(item);
    itemsByOrder.set(item.orderCode, list);
  }
  const attachItems = <T extends { orderCode: string }>(rows: T[]) =>
    rows.map((row) => ({
      ...row,
      items: itemsByOrder.get(row.orderCode) || [],
    }));
  const requestRows = attachItems(requests.results as Array<{ orderCode: string }>);
  const activeRow = active.results[0] as ({ orderCode: string } | undefined);
  const walletRow = walletSummary.results[0] as
    | { grossEarnings: number; withdrawn: number }
    | undefined;
  const grossEarnings = Number(walletRow?.grossEarnings || 0);
  const walletBalance = Math.max(
    0,
    grossEarnings - Number(walletRow?.withdrawn || 0),
  );
  const todayRow = todaySummary.results[0] as
    | { todayOrders: number; todayEarnings: number; todayCod: number }
    | undefined;
  return Response.json({
    user: session.displayName,
    rider: {
      ...rider,
      walletBalance,
      cod_collection: Number(todayRow?.todayCod || 0),
    },
    requests: requestRows,
    active: activeRow ? attachItems([activeRow])[0] : null,
    history: history.results,
    payouts: payouts.results,
    earnings: {
      todayOrders: Number(todayRow?.todayOrders || 0),
      today: Number(todayRow?.todayEarnings || 0),
      total: grossEarnings,
    },
  }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
}

export async function PATCH(request: Request) {
  const auth = await riderAuth();
  if (auth.status === "unauthorized")
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.status === "unassigned")
    return Response.json(
      { error: "Is rider panel user ko abhi rider profile assign nahi hua hai." },
      { status: 409 },
    );
  const { db, session } = auth;
  const body = (await request.json()) as Record<string, unknown>;
  const action = String(body.action || "");
  if (action === "availability") {
    const latitude =
      body.latitude === undefined || body.latitude === null ? null : Number(body.latitude);
    const longitude =
      body.longitude === undefined || body.longitude === null ? null : Number(body.longitude);
    await db
      .prepare(
        "UPDATE market_riders SET is_online=?,latitude=?,longitude=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      )
      .bind(
        body.isOnline ? 1 : 0,
        Number.isFinite(latitude) ? latitude : null,
        Number.isFinite(longitude) ? longitude : null,
        session.riderId,
      )
      .run();
  } else if (action === "location") {
    await db
      .prepare(
        "UPDATE market_riders SET latitude=?,longitude=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      )
      .bind(Number(body.latitude), Number(body.longitude), session.riderId)
      .run();
  } else if (action === "accept") {
    const orderCode = String(body.orderCode);
    const existing = await db
      .prepare(
        "SELECT rider_id riderId,status FROM market_delivery_assignments WHERE order_code=?",
      )
      .bind(orderCode)
      .first<{ riderId: number; status: string }>();
    if (existing && existing.riderId !== session.riderId)
      return Response.json(
        { error: "Order kisi aur rider ko mil gaya" },
        { status: 409 },
      );
    const order = await db
      .prepare("SELECT delivery_fee deliveryFee,status FROM market_orders WHERE order_code=?")
      .bind(orderCode)
      .first<{ deliveryFee: number; status: string }>();
    if (!order)
      return Response.json({ error: "Order nahi mila" }, { status: 404 });
    if (order.status !== "READY_FOR_PICKUP")
      return Response.json({ error: "Order abhi pickup ke liye ready nahi hai" }, { status: 409 });
    const deliveryFee = Number.isFinite(Number(order.deliveryFee)) && Number(order.deliveryFee) >= 0
      ? Number(order.deliveryFee)
      : 20;
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    if (existing)
      await db
        .prepare(
          "UPDATE market_delivery_assignments SET status='ACTIVE',delivery_fee=?,accepted_at=CURRENT_TIMESTAMP WHERE order_code=? AND rider_id=?",
        )
        .bind(deliveryFee, orderCode, session.riderId)
        .run();
    else
      await db
        .prepare(
          "INSERT INTO market_delivery_assignments (order_code,rider_id,status,delivery_fee,delivery_otp) VALUES (?,?,'ACTIVE',?,?)",
        )
        .bind(orderCode, session.riderId, deliveryFee, otp)
        .run();
    await db.batch([
      db
        .prepare(
          "UPDATE market_orders SET status='OUT_FOR_DELIVERY' WHERE order_code=? AND status='READY_FOR_PICKUP'",
        )
        .bind(orderCode),
      db
        .prepare(
          "INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) VALUES (?,'OUT_FOR_DELIVERY','RIDER',?,'Rider accepted delivery')",
        )
        .bind(orderCode, session.username),
      db
        .prepare(
          "INSERT INTO market_admin_notifications (type,title,message,order_code) VALUES ('RIDER','Rider accepted delivery',?,?)",
        )
        .bind(`${session.displayName} ne delivery accept ki`, orderCode),
    ]);
  } else if (action === "deliver") {
    const orderCode = String(body.orderCode),
      otp = String(body.otp || "");
    const assignment = await db
      .prepare(
        `SELECT a.delivery_otp deliveryOtp,a.delivery_fee deliveryFee,a.tip,
                o.delivery_fee orderDeliveryFee
         FROM market_delivery_assignments a
         JOIN market_orders o ON o.order_code=a.order_code
         WHERE a.order_code=? AND a.rider_id=? AND a.status='ACTIVE'`,
      )
      .bind(orderCode, session.riderId)
      .first<{ deliveryOtp: string; deliveryFee: number; tip: number; orderDeliveryFee: number }>();
    if (!assignment || assignment.deliveryOtp !== otp)
      return Response.json(
        { error: "Customer delivery OTP galat hai" },
        { status: 409 },
      );
    const deliveryFee = Number.isFinite(Number(assignment.orderDeliveryFee)) && Number(assignment.orderDeliveryFee) >= 0
      ? Number(assignment.orderDeliveryFee)
      : Number(assignment.deliveryFee || 20);
    await db.batch([
      db
        .prepare(
          "UPDATE market_delivery_assignments SET status='DELIVERED',delivery_fee=?,delivered_at=CURRENT_TIMESTAMP WHERE order_code=? AND rider_id=?",
        )
        .bind(deliveryFee, orderCode, session.riderId),
      db
        .prepare(
          "UPDATE market_orders SET status='DELIVERED' WHERE order_code=?",
        )
        .bind(orderCode),
      db
        .prepare(
          "INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) VALUES (?,'DELIVERED','RIDER',?,'Delivery OTP verified')",
        )
        .bind(orderCode, session.username),
      db
        .prepare(
          "UPDATE market_transactions SET status='VERIFIED',reference='COD COLLECTED BY RIDER' WHERE order_code=? AND type='PAYMENT' AND method='COD'",
        )
        .bind(orderCode),
      db
        .prepare(
          `UPDATE market_riders
           SET weekly_payout=weekly_payout+
                 ?+coalesce((SELECT tip FROM market_delivery_assignments WHERE order_code=?),0),
               cod_collection=cod_collection+
                 coalesce((SELECT CASE WHEN payment_method='COD' THEN total ELSE 0 END
                           FROM market_orders WHERE order_code=?),0),
               updated_at=CURRENT_TIMESTAMP
           WHERE id=?`,
        )
        .bind(deliveryFee, orderCode, orderCode, session.riderId),
      db
        .prepare(
          `INSERT INTO market_wallet_transactions
           (rider_id,type,amount,balance_after,order_code,note)
           VALUES (
             ?,'DELIVERY_EARNING',
             ?+coalesce((SELECT tip FROM market_delivery_assignments WHERE order_code=?),0),
             coalesce((SELECT sum(coalesce(a.delivery_fee,20)+coalesce(a.tip,0))
                       FROM market_delivery_assignments a
                       WHERE a.rider_id=? AND a.status='DELIVERED'),0)-
             coalesce((SELECT sum(amount) FROM market_payouts
                       WHERE payee_type='RIDER' AND payee_id=?
                         AND status IN ('PENDING','APPROVED','PAID')),0),
             ?,'Delivery completed'
           )`,
        )
        .bind(session.riderId, deliveryFee, orderCode, session.riderId, session.riderId, orderCode),
      db
        .prepare(
          "INSERT INTO market_admin_notifications (type,title,message,order_code) VALUES ('DELIVERED','Order delivered',?,?)",
        )
        .bind(`${session.displayName} ne order deliver kiya`, orderCode),
    ]);
  } else if (action === "bank") {
    const last = String(body.account || "")
      .replace(/\D/g, "")
      .slice(-4);
    await db
      .prepare("UPDATE market_riders SET bank_account_masked=? WHERE id=?")
      .bind(last ? `•••• ${last}` : "", session.riderId)
      .run();
  } else if (action === "upi") {
    const upiId = String(body.upiId || "")
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9._-]{2,}@[a-z0-9.-]{2,}$/i.test(upiId))
      return Response.json(
        { error: "Valid UPI ID daalo, jaise name@bank" },
        { status: 400 },
      );
    await db
      .prepare(
        "UPDATE market_riders SET upi_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      )
      .bind(upiId, session.riderId)
      .run();
  } else if (action === "withdraw") {
    const amount = Math.floor(Number(body.amount));
    const wallet = await db
      .prepare(
        `SELECT r.upi_id upiId,
           coalesce((SELECT sum(coalesce(a.delivery_fee,20)+coalesce(a.tip,0))
                     FROM market_delivery_assignments a
                     WHERE a.rider_id=r.id AND a.status='DELIVERED'),0)-
           coalesce((SELECT sum(p.amount) FROM market_payouts p
                     WHERE p.payee_type='RIDER' AND p.payee_id=r.id
                       AND p.status IN ('PENDING','APPROVED','PAID')),0) walletBalance
         FROM market_riders r WHERE r.id=?`,
      )
      .bind(session.riderId)
      .first<{ walletBalance: number; upiId: string }>();
    if (!wallet?.upiId)
      return Response.json(
        { error: "Withdrawal se pehle UPI ID save karo" },
        { status: 400 },
      );
    if (!Number.isInteger(amount) || amount < 20)
      return Response.json(
        { error: "Minimum withdrawal ₹20 hai" },
        { status: 400 },
      );
    if (amount > Number(wallet.walletBalance || 0))
      return Response.json(
        { error: "Wallet balance kam hai" },
        { status: 409 },
      );
    const period = new Date().toISOString().slice(0, 7);
    await db
      .prepare(
        "UPDATE market_riders SET weekly_payout=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      )
      .bind(Number(wallet.walletBalance) - amount, session.riderId)
      .run();
    const payout = await db
      .prepare(
        `INSERT INTO market_payouts
         (payee_type,payee_id,period,amount,status,upi_id)
         VALUES ('RIDER',?,?,?,'PENDING',?)`,
      )
      .bind(session.riderId, period, amount, wallet.upiId)
      .run();
    const payoutId = Number(payout.meta.last_row_id || 0);
    await db.batch([
      db
        .prepare(
          `INSERT INTO market_wallet_transactions
           (rider_id,type,amount,balance_after,payout_id,note)
           VALUES (?,'WITHDRAWAL_REQUEST',?,?,?,?)`,
        )
        .bind(
          session.riderId,
          amount,
          Number(wallet.walletBalance) - amount,
          payoutId || null,
          "Withdrawal requested",
        ),
      db
        .prepare(
          "INSERT INTO market_admin_notifications (type,title,message) VALUES ('PAYOUT','Rider withdrawal request',?)",
        )
        .bind(
          `${session.displayName} ne ₹${amount} withdrawal request bheja`,
        ),
    ]);
  } else return Response.json({ error: "Unknown action" }, { status: 400 });
  await db
    .prepare(
      "INSERT INTO market_admin_activity (username,action,target,details) VALUES (?,?,?,?)",
    )
    .bind(
      session.username,
      `RIDER_${action.toUpperCase()}`,
      String(body.orderCode || session.riderId),
      JSON.stringify({ riderId: session.riderId }),
    )
    .run();
  return Response.json({ ok: true });
}
