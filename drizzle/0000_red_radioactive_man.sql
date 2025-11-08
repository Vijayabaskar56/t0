CREATE TABLE `categories` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`collection_id` integer NOT NULL,
	`image_url` text,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `categories_collection_id_idx` ON `categories` (`collection_id`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` text NOT NULL,
	`subcategory_slug` text NOT NULL,
	`image_url` text,
	FOREIGN KEY (`subcategory_slug`) REFERENCES `subcategories`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `products_subcategory_slug_idx` ON `products` (`subcategory_slug`);--> statement-breakpoint
CREATE TABLE `subcategories` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subcollection_id` integer NOT NULL,
	`image_url` text,
	FOREIGN KEY (`subcollection_id`) REFERENCES `subcollections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subcategories_subcollection_id_idx` ON `subcategories` (`subcollection_id`);--> statement-breakpoint
CREATE TABLE `subcollections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category_slug` text NOT NULL,
	FOREIGN KEY (`category_slug`) REFERENCES `categories`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `subcollections_category_slug_idx` ON `subcollections` (`category_slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text(100) NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);