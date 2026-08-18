import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function patch(relativePath, transform) {
  const target = path.join(root, relativePath);
  const source = fs.readFileSync(target, "utf8");
  const next = transform(source);
  if (next === source) throw new Error(`Live tip patch did not change ${relativePath}`);
  fs.writeFileSync(target, next);
}

patch("app/api/admin/control/route.ts", (source) => {
  const oldToday = `(SELECT coalesce(sum(coalesce(a.tip,0)),0)\n          FROM market_delivery_assignments a\n          JOIN market_orders o ON o.order_code=a.order_code\n          WHERE a.status='DELIVERED' AND o.status='DELIVERED'\n            AND date(datetime(a.delivered_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) todayTips,`;
  const oldMonth = `(SELECT coalesce(sum(coalesce(a.tip,0)),0)\n          FROM market_delivery_assignments a\n          JOIN market_orders o ON o.order_code=a.order_code\n          WHERE a.status='DELIVERED' AND o.status='DELIVERED'\n            AND strftime('%Y-%m',datetime(a.delivered_at,'+5 hours','+30 minutes'))=strftime('%Y-%m',datetime('now','+5 hours','+30 minutes'))) monthlyTips,`;
  const newToday = `(SELECT coalesce(sum(amount),0)\n          FROM market_transactions\n          WHERE type='TIP'\n            AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) todayTips,`;
  const newMonth = `(SELECT coalesce(sum(amount),0)\n          FROM market_transactions\n          WHERE type='TIP'\n            AND strftime('%Y-%m',datetime(created_at,'+5 hours','+30 minutes'))=strftime('%Y-%m',datetime('now','+5 hours','+30 minutes'))) monthlyTips,`;
  if (source.includes(newToday) && source.includes(newMonth)) return source;
  if (!source.includes(oldToday) || !source.includes(oldMonth)) throw new Error("Live tip query block not found in admin control");
  return source.replace(oldToday, newToday).replace(oldMonth, newMonth);
});

patch("app/api/admin/bootstrap/route.ts", (source) => {
  const oldToday = `(SELECT coalesce(sum(coalesce(a.tip,0)),0)\n            FROM market_delivery_assignments a\n            JOIN market_orders o ON o.order_code=a.order_code\n           WHERE a.status='DELIVERED' AND o.status='DELIVERED'\n             AND date(datetime(a.delivered_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) todayTips,`;
  const oldMonth = `(SELECT coalesce(sum(coalesce(a.tip,0)),0)\n            FROM market_delivery_assignments a\n            JOIN market_orders o ON o.order_code=a.order_code\n           WHERE a.status='DELIVERED' AND o.status='DELIVERED'\n             AND strftime('%Y-%m',datetime(a.delivered_at,'+5 hours','+30 minutes'))=strftime('%Y-%m',datetime('now','+5 hours','+30 minutes'))) monthlyTips,`;
  const newToday = `(SELECT coalesce(sum(amount),0)\n            FROM market_transactions\n           WHERE type='TIP'\n             AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) todayTips,`;
  const newMonth = `(SELECT coalesce(sum(amount),0)\n            FROM market_transactions\n           WHERE type='TIP'\n             AND strftime('%Y-%m',datetime(created_at,'+5 hours','+30 minutes'))=strftime('%Y-%m',datetime('now','+5 hours','+30 minutes'))) monthlyTips,`;
  if (source.includes(newToday) && source.includes(newMonth)) return source;
  if (!source.includes(oldToday) || !source.includes(oldMonth)) throw new Error("Live tip query block not found in bootstrap");
  return source.replace(oldToday, newToday).replace(oldMonth, newMonth);
});

console.log("Live Today Tip and Monthly Tip now read market_transactions TIP records in IST.");
