CREATE TABLE IF NOT EXISTS market_item_expiry (
  item_id INTEGER PRIMARY KEY,
  expiry_date TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES market_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_market_item_expiry_date
  ON market_item_expiry(expiry_date);
