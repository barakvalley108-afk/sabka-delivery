CREATE TABLE `market_campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`channel` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`audience` text DEFAULT 'ALL' NOT NULL,
	`status` text DEFAULT 'QUEUED' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_delivery_assignments` (
	`order_code` text PRIMARY KEY NOT NULL,
	`rider_id` integer NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`delivery_fee` integer DEFAULT 35 NOT NULL,
	`tip` integer DEFAULT 0 NOT NULL,
	`delivery_otp` text NOT NULL,
	`accepted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`delivered_at` text
);
--> statement-breakpoint
CREATE TABLE `market_payouts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payee_type` text NOT NULL,
	`payee_id` integer NOT NULL,
	`period` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_promotions` (
	`code` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`discount_type` text DEFAULT 'FLAT' NOT NULL,
	`discount_value` integer NOT NULL,
	`min_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`uses` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_code` text NOT NULL,
	`store_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_riders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`is_online` integer DEFAULT 0 NOT NULL,
	`document_status` text DEFAULT 'PENDING' NOT NULL,
	`bank_account_masked` text DEFAULT '' NOT NULL,
	`weekly_payout` integer DEFAULT 0 NOT NULL,
	`cod_collection` integer DEFAULT 0 NOT NULL,
	`latitude` real,
	`longitude` real,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `market_riders_email_unique` ON `market_riders` (`email`);--> statement-breakpoint
CREATE TABLE `market_staff_access` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`store_id` integer,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_store_controls` (
	`store_id` integer PRIMARY KEY NOT NULL,
	`commission_rate` real DEFAULT 18 NOT NULL,
	`approved` integer DEFAULT 1 NOT NULL,
	`blocked` integer DEFAULT 0 NOT NULL,
	`settlement_cycle` text DEFAULT 'WEEKLY' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
