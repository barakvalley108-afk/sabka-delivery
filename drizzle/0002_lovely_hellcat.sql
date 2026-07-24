CREATE TABLE `market_coupon_claims` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mobile` text NOT NULL,
	`coupon_code` text NOT NULL,
	`order_code` text NOT NULL,
	`discount` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `market_coupon_claims_order_code_unique` ON `market_coupon_claims` (`order_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `market_coupon_claims_mobile_code_unique` ON `market_coupon_claims` (`mobile`,`coupon_code`);