import { ensureControlTables } from "../../../../db/control-store";
import { getPanelSession } from "../../../panel-auth";

export async function GET() {
  const session = await getPanelSession("SUPER_ADMIN");
  if (!session || session.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await ensureControlTables();
  const [orders, orderItems, notifications, settings, summary] = await db.batch([
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
       ORDER BY o.created_at DESC LIMIT 20`,
    ),
    db.prepare(
      `SELECT oi.order_code orderCode,oi.item_name itemName,oi.variant_label variantLabel,
              oi.quantity,oi.unit_price unitPrice
       FROM market_order_items oi
       JOIN (SELECT order_code FROM market_orders ORDER BY created_at DESC LIMIT 20) recent
         ON recent.order_code=oi.order_code`,
    ),
    db.prepare(
      `SELECT id,type,title,message,order_code orderCode,is_read isRead,created_at createdAt
       FROM market_admin_notifications ORDER BY id DESC LIMIT 20`,
    ),
    db.prepare(
      `SELECT key,value FROM market_settings
       WHERE key IN ('upi_id','delivery_charge','support_number','maintenance_mode',
                     'order_accept_mode','website_name','theme_primary','theme_accent',
                     'theme_background')`,
    ),
    db.prepare(
      `SELECT
         (SELECT count(*) FROM market_orders
           WHERE date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) totalOrders,
         (SELECT coalesce(sum(total),0) FROM market_orders
           WHERE status='DELIVERED'
             AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) totalSales,
         (SELECT count(*) FROM market_orders
           WHERE status NOT IN ('DELIVERED','CANCELLED')
             AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) activeOrders,
         (SELECT count(*) FROM market_stores WHERE is_open=1) openStores,
         (SELECT count(*) FROM market_riders WHERE is_online=1) onlineRiders,
         (SELECT count(*) FROM market_panel_sessions WHERE expires_at>CURRENT_TIMESTAMP) activePanels`,
    ),
  ]);

  return Response.json({
    owner: session.displayName,
    stores: [],
    accounts: [],
    riders: [],
    payouts: [],
    orders: orders.results,
    orderItems: orderItems.results,
    items: [],
    notifications: notifications.results,
    settings: Object.fromEntries(
      settings.results.map((row) => [String(row.key), String(row.value)]),
    ),
    promotions: [],
    offers: [],
    content: [],
    categories: [],
    sections: [],
    summary: summary.results[0] || {
      totalOrders: 0,
      totalSales: 0,
      activeOrders: 0,
      openStores: 0,
      onlineRiders: 0,
      activePanels: 0,
    },
    bootstrap: true,
  });
}
