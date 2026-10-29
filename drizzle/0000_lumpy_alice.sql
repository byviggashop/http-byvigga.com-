CREATE TABLE `order_rate_limits` (
	`bucket` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`payload_hash` text NOT NULL,
	`payload` text NOT NULL,
	`mail_status` text NOT NULL,
	`status` text NOT NULL,
	`payment_status` text NOT NULL,
	`created_at` integer NOT NULL,
	`provider_id` text,
	`locked_until` integer
);
