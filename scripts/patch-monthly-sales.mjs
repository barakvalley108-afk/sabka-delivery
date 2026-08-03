import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function patch(relativePath, transform) {
  const target = path.join(root, relativePath);
  const source = fs.readFileSync(target, "utf8");
  const next = transform(source);
  if (next === source) throw new Error(`Monthly sales patch did not change ${relativePath}`);
  fs.writeFileSync(target, next);
}

patch("app/api/admin/control/route.ts", (source) => {
  const needle = `(SELECT coalesce(sum(total),0) FROM market_orders WHERE status='DELIVERED' AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) totalSales,`;
  const replacement = `(SELECT coalesce(sum(subtotal),0) FROM market_orders WHERE status='DELIVERED' AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) totalSales,\n         (SELECT coalesce(sum(delivery_fee),0) FROM market_orders WHERE status='DELIVERED' AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) deliveryCharges,\n         (SELECT coalesce(sum(subtotal),0) FROM market_orders\n          WHERE status='DELIVERED'\n            AND strftime('%Y-%m',datetime(created_at,'+5 hours','+30 minutes'))=strftime('%Y-%m',datetime('now','+5 hours','+30 minutes'))) monthlySales,`;
  if (!source.includes(needle)) throw new Error("Admin summary totalSales query not found");
  return source.replace(needle, replacement);
});

patch("app/super-admin/admin-console.tsx", (source) => {
  const summaryNeedle = `summary:{totalOrders:number;totalSales:number;activeOrders:number;openStores:number;onlineRiders:number;activePanels:number}`;
  const summaryReplacement = `summary:{totalOrders:number;totalSales:number;deliveryCharges:number;monthlySales:number;activeOrders:number;openStores:number;onlineRiders:number;activePanels:number}`;
  if (!source.includes(summaryNeedle)) throw new Error("Admin Data summary type not found");
  source = source.replace(summaryNeedle, summaryReplacement);

  const metricsNeedle = `const metrics=[{label:"Today's sales",value:money(data.summary.totalSales),tone:"red"},{label:"Today's orders",value:data.summary.totalOrders,tone:"green"}`;
  const metricsReplacement = `const metrics=[{label:"Today's sales",value:money(data.summary.totalSales),tone:"red"},{label:"Monthly sales",value:money(data.summary.monthlySales||0),tone:"purple"},{label:"Delivery charges",value:money(data.summary.deliveryCharges||0),tone:"blue"},{label:"Today's orders",value:data.summary.totalOrders,tone:"green"}`;
  if (!source.includes(metricsNeedle)) throw new Error("Dashboard metrics array not found");
  source = source.replace(metricsNeedle, metricsReplacement);

  source = source.replace(
    `Daily counters automatically reset at 12:00 AM IST. Order history safe rahegi.`,
    `Sales cards delivery fee ke bina hain. Delivery charges alag dikhte hain. Daily counters 12:00 AM IST aur monthly sales naye month ke 1st day 12:00 AM IST par reset hoti hai. Order history safe rahegi.`,
  );
  return source;
});

console.log("Sales and delivery charge metrics separated on Super Admin dashboard.");
