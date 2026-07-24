CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_code` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`area` text NOT NULL,
	`payment_method` text NOT NULL,
	`items_json` text NOT NULL,
	`subtotal` integer NOT NULL,
	`delivery_fee` integer DEFAULT 20 NOT NULL,
	`total` integer NOT NULL,
	`status` text DEFAULT 'PLACED' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_code_unique` ON `orders` (`order_code`);