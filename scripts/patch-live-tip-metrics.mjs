import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function patch(relativePath, transform) {
  const target = path.join(root, relativePath);
  const source = fs.readFileSync(target, "utf8");
  const next = transform(source);
  if (next !== source) fs.writeFileSync(target, next);
}

function replaceOnce(source, oldText, newText, label) {
  if (source.includes(newText)) return source;
  if (!source.includes(oldText)) throw new Error(`${label} block not found`);
  return source.replace(oldText, newText);
}

// Only VERIFIED tips count toward Today/Monthly Tip. A cancelled order's
// refunded tip is marked REFUNDED, so it disappears from both metrics.
patch("app/api/admin/control/route.ts", (source) => {
  const oldToday = `(SELECT coalesce(sum(coalesce(a.tip,0)),0)\n          FROM market_delivery_assignments a\n          JOIN market_orders o ON o.order_code=a.order_code\n          WHERE a.status='DELIVERED' AND o.status='DELIVERED'\n            AND date(datetime(a.delivered_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) todayTips,`;
  const oldMonth = `(SELECT coalesce(sum(coalesce(a.tip,0)),0)\n          FROM market_delivery_assignments a\n          JOIN market_orders o ON o.order_code=a.order_code\n          WHERE a.status='DELIVERED' AND o.status='DELIVERED'\n            AND strftime('%Y-%m',datetime(a.delivered_at,'+5 hours','+30 minutes'))=strftime('%Y-%m',datetime('now','+5 hours','+30 minutes'))) monthlyTips,`;
  const newToday = `(SELECT coalesce(sum(amount),0)\n          FROM market_transactions\n          WHERE type='TIP' AND status='VERIFIED'\n            AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) todayTips,`;
  const newMonth = `(SELECT coalesce(sum(amount),0)\n          FROM market_transactions\n          WHERE type='TIP' AND status='VERIFIED'\n            AND strftime('%Y-%m',datetime(created_at,'+5 hours','+30 minutes'))=strftime('%Y-%m',datetime('now','+5 hours','+30 minutes'))) monthlyTips,`;
  if (!source.includes(newToday) || !source.includes(newMonth)) {
    if (!source.includes(oldToday) || !source.includes(oldMonth)) throw new Error("Tip metric query block not found in admin control");
    source = source.replace(oldToday, newToday).replace(oldMonth, newMonth);
  }

  const oldOrder = `    if (action === "order") {\n    const orderCode = String(body.orderCode);\n    const status = String(body.status);\n    const updated = await db\n      .prepare("UPDATE market_orders SET status=? WHERE order_code=?")\n      .bind(status, orderCode)\n      .run();\n    if (updated.meta.changes)\n      await db\n        .prepare(\n          "INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) VALUES (?,?,?,?,?)",\n        )\n        .bind(orderCode, status, "ADMIN", session.username, "Admin status update")\n        .run();\n  } else if (action === "assignRider") {`;
  const newOrder = `    if (action === "order") {\n    const orderCode = String(body.orderCode);\n    const status = String(body.status);\n    const deliveredTip = status === "CANCELLED"\n      ? await db\n          .prepare(\n            "SELECT a.tip,a.rider_id riderId FROM market_delivery_assignments a WHERE a.order_code=? LIMIT 1",\n          )\n          .bind(orderCode)\n          .first<{ tip: number; riderId: number }>()\n      : null;\n    const updated = await db\n      .prepare("UPDATE market_orders SET status=? WHERE order_code=?")\n      .bind(status, orderCode)\n      .run();\n    if (updated.meta.changes) {\n      if (status === "CANCELLED" && deliveredTip && Number(deliveredTip.tip || 0) > 0) {\n        const tip = Number(deliveredTip.tip);\n        await db.batch([\n          db\n            .prepare("UPDATE market_transactions SET status='REFUNDED',reference='TIP REFUNDED ON ORDER CANCEL' WHERE order_code=? AND type='TIP' AND status!='REFUNDED'")\n            .bind(orderCode),\n          db\n            .prepare("UPDATE market_delivery_assignments SET tip=0 WHERE order_code=?")\n            .bind(orderCode),\n          db\n            .prepare("UPDATE market_riders SET weekly_payout=max(0,weekly_payout-?) WHERE id=?")\n            .bind(tip, Number(deliveredTip.riderId)),\n        ]);\n      }\n      await db\n        .prepare(\n          "INSERT INTO market_order_status_history (order_code,status,actor_type,actor_id,note) VALUES (?,?,?,?,?)",\n        )\n        .bind(orderCode, status, "ADMIN", session.username, status === "CANCELLED" ? "Admin cancelled order; tip refunded" : "Admin status update")\n        .run();\n    }\n  } else if (action === "assignRider") {`;
  return replaceOnce(source, oldOrder, newOrder, "Admin order status");
});

patch("app/api/admin/bootstrap/route.ts", (source) => {
  const oldToday = `(SELECT coalesce(sum(coalesce(a.tip,0)),0)\n            FROM market_delivery_assignments a\n            JOIN market_orders o ON o.order_code=a.order_code\n           WHERE a.status='DELIVERED' AND o.status='DELIVERED'\n             AND date(datetime(a.delivered_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) todayTips,`;
  const oldMonth = `(SELECT coalesce(sum(coalesce(a.tip,0)),0)\n            FROM market_delivery_assignments a\n            JOIN market_orders o ON o.order_code=a.order_code\n           WHERE a.status='DELIVERED' AND o.status='DELIVERED'\n             AND strftime('%Y-%m',datetime(a.delivered_at,'+5 hours','+30 minutes'))=strftime('%Y-%m',datetime('now','+5 hours','+30 minutes'))) monthlyTips,`;
  const newToday = `(SELECT coalesce(sum(amount),0)\n            FROM market_transactions\n           WHERE type='TIP' AND status='VERIFIED'\n             AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) todayTips,`;
  const newMonth = `(SELECT coalesce(sum(amount),0)\n            FROM market_transactions\n           WHERE type='TIP' AND status='VERIFIED'\n             AND strftime('%Y-%m',datetime(created_at,'+5 hours','+30 minutes'))=strftime('%Y-%m',datetime('now','+5 hours','+30 minutes'))) monthlyTips,`;
  if (!source.includes(newToday) || !source.includes(newMonth)) {
    if (!source.includes(oldToday) || !source.includes(oldMonth)) throw new Error("Tip metric query block not found in bootstrap");
    source = source.replace(oldToday, newToday).replace(oldMonth, newMonth);
  }
  return source;
});

patch("app/api/rider/control/route.ts", (source) => {
  const old = `      db\n        .prepare(\n          "UPDATE market_transactions SET status='VERIFIED',reference='COD COLLECTED BY RIDER' WHERE order_code=? AND type='PAYMENT' AND method='COD'",\n        )\n        .bind(orderCode),`;
  const next = `      db\n        .prepare(\n          "UPDATE market_transactions SET status='VERIFIED',reference='COD COLLECTED BY RIDER' WHERE order_code=? AND type='PAYMENT' AND method='COD'",\n        )\n        .bind(orderCode),\n      db\n        .prepare(\n          "UPDATE market_transactions SET status='VERIFIED',reference='DELIVERY TIP VERIFIED' WHERE order_code=? AND type='TIP' AND status='PENDING'",\n        )\n        .bind(orderCode),`;
  return replaceOnce(source, old, next, "Rider delivery tip verification");
});

console.log("Today/monthly tips now count only verified tips; cancelling a delivered order refunds and removes its tip.");
