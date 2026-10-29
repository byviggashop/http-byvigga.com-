CREATE TABLE `product_daily_views` (
	`key` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`day` text NOT NULL,
	`views` integer NOT NULL
);
