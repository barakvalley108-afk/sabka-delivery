const schemaSql = [
  `CREATE TABLE IF NOT EXISTS market_stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('FOOD','GROCERY')),
  description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  eta TEXT NOT NULL DEFAULT '25-35 min',
  rating REAL NOT NULL DEFAULT 4.5,
  image TEXT NOT NULL DEFAULT '',
  is_open INTEGER NOT NULL DEFAULT 1
)`,
  `CREATE TABLE IF NOT EXISTS market_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL REFERENCES market_stores(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🛍️',
  food_type TEXT NOT NULL DEFAULT 'VEG',
  is_active INTEGER NOT NULL DEFAULT 1
)`,
  `CREATE TABLE IF NOT EXISTS market_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES market_items(id),
  label TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_value REAL NOT NULL DEFAULT 1,
  price INTEGER NOT NULL,
  discount_price INTEGER,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
)`,
  `CREATE TABLE IF NOT EXISTS market_orders (
  order_code TEXT PRIMARY KEY,
  mobile TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  store_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  area TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 20,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACCEPTED',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT NOT NULL REFERENCES market_orders(order_code),
  variant_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS market_coupon_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT NOT NULL,
  coupon_code TEXT NOT NULL,
  order_code TEXT NOT NULL UNIQUE,
  discount INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mobile, coupon_code)
)`,
  `CREATE TABLE IF NOT EXISTS otp_challenges (
  id TEXT PRIMARY KEY,
  mobile TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT NOT NULL UNIQUE,
  name TEXT,
  is_verified INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
  `CREATE TABLE IF NOT EXISTS market_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES market_users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
];

async function initializeMarketTables() {
  const { env } = await import("cloudflare:workers");
  const db = env.DB;
  if (!db) throw new Error("Market database is unavailable");
  await db.batch(schemaSql.map((sql) => db.prepare(sql)));
  return db;
}

let marketDatabasePromise: ReturnType<typeof initializeMarketTables> | null = null;

export async function ensureMarketTables() {
  marketDatabasePromise ??= initializeMarketTables();
  try {
    return await marketDatabasePromise;
  } catch (error) {
    marketDatabasePromise = null;
    throw error;
  }
}
