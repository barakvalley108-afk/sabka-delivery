CREATE TABLE IF NOT EXISTS `market_catalog_snapshots` (
  `id` integer PRIMARY KEY NOT NULL CHECK (`id` = 1),
  `catalog_json` text NOT NULL,
  `catalog_version` integer NOT NULL,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
