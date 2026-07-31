-- Sabka Delivery: free customer login with mobile + 4-digit PIN -- Apply once to the Cloudflare D1 database bound to the Worker as DB. -- Safe to run more than once because this migration only creates missing tables/indexes.

CREATE TABLE IF NOT EXISTS market_customer_auth ( user_id INTEGER PRIMARY KEY, pincode TEXT NOT NULL, pin_salt TEXT NOT NULL, pin_hash TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES market_users(id) ON DELETE CASCADE );

CREATE TABLE IF NOT EXISTS market_customer_addresses ( id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, recipient_name TEXT NOT NULL, mobile TEXT NOT NULL, address_line TEXT NOT NULL, landmark TEXT NOT NULL DEFAULT '', area TEXT NOT NULL DEFAULT '', pincode TEXT NOT NULL, is_default INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES market_users(id) ON DELETE CASCADE );

CREATE TABLE IF NOT EXISTS market_customer_login_activity ( id INTEGER PRIMARY KEY AUTOINCREMENT, mobile TEXT NOT NULL, success INTEGER NOT NULL DEFAULT 0, ip_address TEXT NOT NULL DEFAULT '', user_agent TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP );

CREATE INDEX IF NOT EXISTS market_customer_addresses_mobile_idx ON market_customer_addresses (mobile);

CREATE INDEX IF NOT EXISTS market_customer_addresses_pincode_idx ON market_customer_addresses (pincode);

CREATE INDEX IF NOT EXISTS market_customer_login_activity_lookup_idx ON market_customer_login_activity (mobile, success, created_at);
