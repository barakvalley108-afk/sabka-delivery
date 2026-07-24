CREATE TABLE IF NOT EXISTS `market_order_status_history` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `order_code` text NOT NULL,
  `status` text NOT NULL,
  `actor_type` text NOT NULL DEFAULT 'SYSTEM',
  `actor_id` text NOT NULL DEFAULT '',
  `note` text NOT NULL DEFAULT '',
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `market_order_status_history_order_idx`
ON `market_order_status_history` (`order_code`,`created_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `market_wallet_transactions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `rider_id` integer NOT NULL,
  `type` text NOT NULL,
  `amount` integer NOT NULL,
  `balance_after` integer NOT NULL,
  `order_code` text,
  `payout_id` integer,
  `note` text NOT NULL DEFAULT '',
  `created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `market_wallet_transactions_rider_idx`
ON `market_wallet_transactions` (`rider_id`,`created_at`);
