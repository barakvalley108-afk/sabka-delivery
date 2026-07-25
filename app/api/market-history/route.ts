import { ensureControlTables } from "../../../db/control-store";

type HistoryOrder = {
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { search?: string; mobile?: string };
    const search = String(body.search || body.mobile || "").trim();

    if (!search) {
      return Response.json(
        { error: "Mobile number ya Order ID daalo" },
        { status: 400 },
      );
    }

    const isMobileNumber = /^\d{10}$/.test(search);
    const isOrderId = /^[a-zA-Z0-9_-]{3,40}$/.test(search);

    if (!isMobileNumber && !isOrderId) {
      return Response.json(
        { error: "Valid 10-digit mobile number ya Order ID daalo" },
        { status: 400 },
      );
    }

    const db = await ensureControlTables();
    const query = `SELECT o.order_code orderCode,o.status,o.total,o.area,
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

    const result = isMobileNumber
      ? await db
          .prepare(`${query} WHERE o.mobile=? ORDER BY o.created_at DESC LIMIT 30`)
          .bind(search)
          .all<HistoryOrder>()
      : await db
          .prepare(`${query} WHERE UPPER(o.order_code)=UPPER(?) ORDER BY o.created_at DESC LIMIT 1`)
          .bind(search)
          .all<HistoryOrder>();

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
