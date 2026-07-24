const ordersTableSql = `CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  order_code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  area TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  items_json TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 20,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLACED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export async function ensureOrdersTable() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) throw new Error("Order database is unavailable");
  await env.DB.prepare(ordersTableSql).run();
}
