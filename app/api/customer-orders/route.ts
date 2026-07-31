import { ensureControlTables } from "../../../db/control-store";
import { sha256 } from "../../../db/otp-utils";

type OrderRow = {
  orderCode: string;
  status: string;
  total: number;
  area: string;
  createdAt: string;
  storeName: string;
  storeType: string;
  deliveryOtp: string | null;
  riderName: string | null;
  riderPhone: string | null;
  paymentMethod: string;
  paymentStatus: string | null;
};

function getSessionToken(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  return (
    cookie.match(/(?:^|; )sabka_session=([^;]+)/)?.[1] ||
    cookie.match(/(?:^|; )apna_session=([^;]+)/)?.[1] ||
    ""
  );
}

export async function GET(request: Request) {
  try {
    const token = getSessionToken(request);
    if (!token) return Response.json({ error: "Login required" }, { status: 401 });

    const db = await ensureControlTables();
    const tokenHash = await sha256(token);
    const user = await db
      .prepare(
        `SELECT u.id, u.mobile
         FROM market_sessions s
         JOIN market_users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`,
      )
      .bind(tokenHash)
      .first<{ id: number; mobile: string }>();

    if (!user) return Response.json({ error: "Session expired" }, { status: 401 });

    const url = new URL(request.url);
    const orderId = String(url.searchParams.get("orderId") || "").trim();
    if (orderId && !/^[a-zA-Z0-9_-]{3,40}$/.test(orderId)) {
      return Response.json({ error: "Valid Order ID daalo" }, { status: 400 });
    }

    const baseQuery = `SELECT o.order_code orderCode,o.status,o.total,o.area,
      o.created_at createdAt,s.name storeName,coalesce(ss.section_key,p.vertical,s.type) storeType,
      o.payment_method paymentMethod,t.status paymentStatus,
      CASE WHEN o.status='OUT_FOR_DELIVERY' THEN a.delivery_otp ELSE NULL END deliveryOtp,
      CASE WHEN o.status='OUT_FOR_DELIVERY' THEN r.name ELSE NULL END riderName,
      CASE WHEN o.status='OUT_FOR_DELIVERY' THEN r.phone ELSE NULL END riderPhone
      FROM market_orders o JOIN market_stores s ON s.id=o.store_id
      LEFT JOIN market_store_sections ss ON ss.store_id=s.id
      LEFT JOIN market_store_profiles p ON p.store_id=s.id
      LEFT JOIN market_delivery_assignments a ON a.order_code=o.order_code
      LEFT JOIN market_riders r ON r.id=a.rider_id
      LEFT JOIN market_transactions t ON t.order_code=o.order_code AND t.type='PAYMENT'`;

    const result = orderId
      ? await db
          .prepare(`${baseQuery} WHERE o.mobile=? AND UPPER(o.order_code)=UPPER(?) ORDER BY o.created_at DESC LIMIT 1`)
          .bind(user.mobile, orderId)
          .all<OrderRow>()
      : await db
          .prepare(`${baseQuery} WHERE o.mobile=? ORDER BY o.created_at DESC LIMIT 50`)
          .bind(user.mobile)
          .all<OrderRow>();

    return Response.json({
      orders: result.results.map((order) => ({
        ...order,
        status: order.status === "PLACED" ? "ACCEPTED" : order.status,
      })),
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Order history load nahi hui" }, { status: 500 });
  }
}
