CREATE TABLE `market_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `market_categories_name_unique` ON `market_categories` (`name`);--> statement-breakpoint
CREATE TABLE `market_content` (
	`key` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_customer_controls` (
	`mobile` text PRIMARY KEY NOT NULL,
	`is_blocked` integer DEFAULT 0 NOT NULL,
	`is_suspicious` integer DEFAULT 0 NOT NULL,
	`wallet_balance` integer DEFAULT 0 NOT NULL,
	`loyalty_points` integer DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_item_addons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`name` text NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_item_flags` (
	`item_id` integer PRIMARY KEY NOT NULL,
	`is_featured` integer DEFAULT 0 NOT NULL,
	`is_popular` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_login_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`success` integer NOT NULL,
	`ip_address` text DEFAULT '' NOT NULL,
	`user_agent` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_panel_accounts` (
	`username` text PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`display_name` text NOT NULL,
	`store_id` integer,
	`rider_id` integer,
	`permissions` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`two_factor_enabled` integer DEFAULT 0 NOT NULL,
	`last_login` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_panel_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_promotion_rules` (
	`code` text PRIMARY KEY NOT NULL,
	`expires_at` text,
	`user_mobile` text,
	`store_id` integer,
	`first_order_only` integer DEFAULT 0 NOT NULL,
	`max_discount` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_review_moderation` (
	`review_id` integer PRIMARY KEY NOT NULL,
	`is_hidden` integer DEFAULT 0 NOT NULL,
	`is_flagged` integer DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_rider_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rider_id` integer NOT NULL,
	`order_code` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_service_areas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`pin_code` text DEFAULT '' NOT NULL,
	`radius_km` real DEFAULT 5 NOT NULL,
	`delivery_charge` integer DEFAULT 20 NOT NULL,
	`min_order` integer DEFAULT 100 NOT NULL,
	`free_delivery_above` integer DEFAULT 9999 NOT NULL,
	`night_charge` integer DEFAULT 0 NOT NULL,
	`rain_charge` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `market_service_areas_name_unique` ON `market_service_areas` (`name`);--> statement-breakpoint
CREATE TABLE `market_store_operations` (
	`store_id` integer PRIMARY KEY NOT NULL,
	`opening_time` text DEFAULT '09:00' NOT NULL,
	`closing_time` text DEFAULT '22:00' NOT NULL,
	`document_status` text DEFAULT 'PENDING' NOT NULL,
	`document_note` text DEFAULT '' NOT NULL,
	`gst_number` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_support_tickets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mobile` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_code` text,
	`type` text NOT NULL,
	`method` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
