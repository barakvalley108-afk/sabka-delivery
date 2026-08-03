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
  const replacement = `(SELECT coalesce(sum(subtotal),0) FROM market_orders WHERE status='DELIVERED' AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) totalSales,\n         (SELECT coalesce(sum(delivery_fee),0) FROM market_orders WHERE status='DELIVERED' AND date(datetime(created_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) deliveryCharges,\n         (SELECT coalesce(sum(subtotal),0) FROM market_orders\n          WHERE status='DELIVERED'\n            AND strftime('%Y-%m',datetime(created_at,'+5 hours','+30 minutes'))=strftime('%Y-%m',datetime('now','+5 hours','+30 minutes'))) monthlySales,\n         (SELECT coalesce(sum(delivery_fee),0) FROM market_orders\n          WHERE status='DELIVERED'\n            AND strftime('%Y-%m',datetime(created_at,'+5 hours','+30 minutes'))=strftime('%Y-%m',datetime('now','+5 hours','+30 minutes'))) monthlyDeliveryCharges,\n         (SELECT coalesce(sum(coalesce(a.tip,0)),0)\n          FROM market_delivery_assignments a\n          JOIN market_orders o ON o.order_code=a.order_code\n          WHERE a.status='DELIVERED' AND o.status='DELIVERED'\n            AND date(datetime(a.delivered_at,'+5 hours','+30 minutes'))=date(datetime('now','+5 hours','+30 minutes'))) todayTips,\n         (SELECT coalesce(sum(coalesce(a.tip,0)),0)\n          FROM market_delivery_assignments a\n          JOIN market_orders o ON o.order_code=a.order_code\n          WHERE a.status='DELIVERED' AND o.status='DELIVERED'\n            AND strftime('%Y-%m',datetime(a.delivered_at,'+5 hours','+30 minutes'))=strftime('%Y-%m',datetime('now','+5 hours','+30 minutes'))) monthlyTips,`;
  if (!source.includes(needle)) throw new Error("Admin summary totalSales query not found");
  return source.replace(needle, replacement);
});

patch("app/super-admin/admin-console.tsx", (source) => {
  const summaryNeedle = `summary:{totalOrders:number;totalSales:number;activeOrders:number;openStores:number;onlineRiders:number;activePanels:number}`;
  const summaryReplacement = `summary:{totalOrders:number;totalSales:number;deliveryCharges:number;monthlySales:number;monthlyDeliveryCharges:number;todayTips:number;monthlyTips:number;activeOrders:number;openStores:number;onlineRiders:number;activePanels:number}`;
  if (!source.includes(summaryNeedle)) throw new Error("Admin Data summary type not found");
  source = source.replace(summaryNeedle, summaryReplacement);

  const dashboardNeedle = `function Dashboard({data,unread,onRead}:{data:Data;unread:number;onRead:(id:number)=>void}){const metrics=[{label:"Today's sales",value:money(data.summary.totalSales),tone:"red"},{label:"Today's orders",value:data.summary.totalOrders,tone:"green"},{label:"Today's active orders",value:data.summary.activeOrders,tone:"orange"},{label:"Open shops",value:data.summary.openStores,tone:"blue"},{label:"Online riders",value:data.summary.onlineRiders,tone:"purple"},{label:"Active panels",value:data.summary.activePanels,tone:"dark"}];return <><p className="daily-reset-note">Daily counters automatically reset at 12:00 AM IST. Order history safe rahegi.</p><section className="metric-grid">{metrics.map(metric=><article className={metric.tone} key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong><span>Live database · resets midnight</span></article>)}</section>`;
  const dashboardReplacement = `function Dashboard({data,unread,onRead}:{data:Data;unread:number;onRead:(id:number)=>void}){const metrics=[{label:"Today's sales",value:money(data.summary.totalSales),tone:"red",note:"Resets daily at 12:00 AM IST"},{label:"Monthly sales",value:money(data.summary.monthlySales||0),tone:"purple",note:"Resets on 1st day of new month"},{label:"Today's delivery charges",value:money(data.summary.deliveryCharges||0),tone:"blue",note:"Resets daily at 12:00 AM IST"},{label:"Monthly delivery charges",value:money(data.summary.monthlyDeliveryCharges||0),tone:"orange",note:"Resets on 1st day of new month"},{label:"Today's tips",value:money(data.summary.todayTips||0),tone:"green",note:"Delivered orders only · resets daily"},{label:"Monthly tips",value:money(data.summary.monthlyTips||0),tone:"purple",note:"Delivered orders only · resets monthly"},{label:"Today's orders",value:data.summary.totalOrders,tone:"green",note:"Resets daily at 12:00 AM IST"},{label:"Today's active orders",value:data.summary.activeOrders,tone:"orange",note:"Live active orders"},{label:"Open shops",value:data.summary.openStores,tone:"blue",note:"Live database"},{label:"Online riders",value:data.summary.onlineRiders,tone:"purple",note:"Live database"},{label:"Active panels",value:data.summary.activePanels,tone:"dark",note:"Live sessions"}];return <><p className="daily-reset-note">Sales amount mein delivery charges aur tips include nahi hain. Tips sirf delivered orders ke baad count hoti hain. Daily cards 12:00 AM IST par aur monthly cards naye month ke 1st day 12:00 AM IST par reset hote hain. Order history safe rahegi.</p><section className="metric-grid">{metrics.map(metric=><article className={metric.tone} key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong><span>{metric.note}</span></article>)}</section>`;
  if (!source.includes(dashboardNeedle)) throw new Error("Dashboard metrics block not found");
  return source.replace(dashboardNeedle, dashboardReplacement);
});

console.log("Daily/monthly sales, delivery charges and delivered tips metrics added.");
