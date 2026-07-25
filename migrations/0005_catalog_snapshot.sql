CREATE TABLE IF NOT EXISTS market_catalog_snapshots (
  id INTEGER PRIMARY KEY CHECK(id=1),
  catalog_json TEXT NOT NULL,
  catalog_version INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
