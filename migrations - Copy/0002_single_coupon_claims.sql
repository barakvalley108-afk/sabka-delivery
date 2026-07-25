CREATE TABLE IF NOT EXISTS market_single_coupon_claims (
  coupon_code TEXT PRIMARY KEY,
  mobile TEXT NOT NULL,
  order_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
