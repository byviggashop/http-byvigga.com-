CREATE TABLE `admin_history` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`actor` text NOT NULL,
	`details` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_workflow` (
	`order_id` text PRIMARY KEY NOT NULL,
	`payment_mail_at` integer,
	`paid_at` integer,
	`fulfilled_at` integer,
	`notes` text NOT NULL,
	`version` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`price` integer NOT NULL,
	`quantity` integer,
	`image` text NOT NULL,
	`description` text NOT NULL,
	`measurements` text NOT NULL,
	`active` integer NOT NULL,
	`version` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shop_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
