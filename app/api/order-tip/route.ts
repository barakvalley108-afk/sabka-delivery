import { ensureControlTables } from "../../../db/control-store";

type Payload = { orderCode?: string; mobile?: string; tip?: number };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const orderCode = body.orderCode?.trim() || "";
    const mobile = body.mobile?.replace(/\D/g, "").slice(-10) || "";
    const tip = Math.floor(Number(body.tip || 0));

    if (!/^SD-/.test(orderCode) || !/^\d{10}$/.test(mobile) || tip < 1 || tip > 500) {
      return Response.json({ error: "Invalid tip details" }, { status: 400 });
    }

    const db = await ensureControlTables();
    const order = await db
      .prepare("SELECT order_code orderCode,payment_method paymentMethod,status,total FROM market_orders WHERE order_code=? AND mobile=?")
      .bind(orderCode, mobile)
      .first<{ orderCode: string; paymentMethod: string; status: string; total: number }>();

    if (!order) return Response.json({ error: "Order nahi mila" }, { status: 404 });
    if (order.paymentMethod !== "COD") {
      return Response.json({ error: "Tip sirf Cash on Delivery order par available hai" }, { status: 409 });
    }
    if (["CANCELLED", "DELIVERED"].includes(order.status)) {
      return Response.json({ error: "Is order par tip add nahi ho sakti" }, { status: 409 });
    }

    const oldTip = await db
      .prepare("SELECT amount FROM market_transactions WHERE order_code=? AND type='TIP' LIMIT 1")
      .bind(orderCode)
      .first<{ amount: number }>();
    if (oldTip) {
      return Response.json({ ok: true, tip: oldTip.amount, total: order.total });
    }

    await db.batch([
      db.prepare("UPDATE market_orders SET total=total+? WHERE order_code=? AND mobile=?").bind(tip, orderCode, mobile),
      db.prepare("UPDATE market_transactions SET amount=amount+? WHERE order_code=? AND type='PAYMENT'").bind(tip, orderCode),
      db.prepare("INSERT INTO market_transactions (order_code,type,method,amount,status,reference) VALUES (?,'TIP','COD',?,'PENDING','Delivery partner tip')").bind(orderCode, tip),
      db.prepare("INSERT INTO market_admin_notifications (type,title,message,order_code) VALUES ('ORDER','Delivery partner tip added',?,?)").bind(`Customer ne delivery partner ke liye ₹${tip} tip add ki`, orderCode),
      db.prepare("INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) SELECT order_code,status,'CUSTOMER',mobile,? FROM market_orders WHERE order_code=?").bind(`Delivery partner tip ₹${tip} added`, orderCode),
    ]);

    return Response.json({ ok: true, tip, total: order.total + tip });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Tip save nahi hui" }, { status: 500 });
  }
}
