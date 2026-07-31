-- Sabka Delivery: editable customer profile with optional profile photo
-- Apply once to the Cloudflare D1 database bound to the Worker as DB.

CREATE TABLE IF NOT EXISTS market_customer_profiles (
  user_id INTEGER PRIMARY KEY,
  photo_data TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES market_users(id) ON DELETE CASCADE
);
