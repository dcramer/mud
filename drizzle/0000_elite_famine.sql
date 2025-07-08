CREATE TABLE `auth_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text,
	`email` text,
	`token` text NOT NULL,
	`type` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_tokens_token_unique` ON `auth_tokens` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_tokens_token` ON `auth_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `idx_auth_tokens_expires` ON `auth_tokens` (`expires_at`);--> statement-breakpoint
CREATE TABLE `character_abilities` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`essence_id` text NOT NULL,
	`realm_id` text NOT NULL,
	`character_name` text NOT NULL,
	`player_id` text NOT NULL,
	`ability_name` text NOT NULL,
	`current_rank` text NOT NULL,
	`awakened` integer DEFAULT 0,
	`metadata` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_abilities_character` ON `character_abilities` (`character_id`);--> statement-breakpoint
CREATE INDEX `idx_abilities_realm_character` ON `character_abilities` (`realm_id`,`character_id`);--> statement-breakpoint
CREATE TABLE `character_essences` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`realm_id` text NOT NULL,
	`character_name` text NOT NULL,
	`player_id` text NOT NULL,
	`essence_type` text NOT NULL,
	`attribute_bound` text NOT NULL,
	`rank_bonded` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_essences_character` ON `character_essences` (`character_id`);--> statement-breakpoint
CREATE INDEX `idx_essences_realm_character` ON `character_essences` (`realm_id`,`character_id`);--> statement-breakpoint
CREATE TABLE `character_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`realm_id` text NOT NULL,
	`character_name` text NOT NULL,
	`player_id` text NOT NULL,
	`player_username` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`slot` integer,
	`metadata` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_inventory_character` ON `character_inventory` (`character_id`);--> statement-breakpoint
CREATE INDEX `idx_inventory_realm_character` ON `character_inventory` (`realm_id`,`character_id`);--> statement-breakpoint
CREATE INDEX `idx_inventory_slot` ON `character_inventory` (`character_id`,`slot`);--> statement-breakpoint
CREATE TABLE `character_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`realm_id` text NOT NULL,
	`character_name` text NOT NULL,
	`player_id` text NOT NULL,
	`skill_name` text NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`experience` integer DEFAULT 0 NOT NULL,
	`is_passive_training` integer DEFAULT 0,
	`passive_training_started` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_skills_character` ON `character_skills` (`character_id`);--> statement-breakpoint
CREATE INDEX `idx_skills_realm_character` ON `character_skills` (`realm_id`,`character_id`);--> statement-breakpoint
CREATE INDEX `idx_skills_training` ON `character_skills` (`is_passive_training`);--> statement-breakpoint
CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`realm_id` text NOT NULL,
	`player_username` text NOT NULL,
	`name` text NOT NULL,
	`rank` text DEFAULT 'normal' NOT NULL,
	`attributes` text DEFAULT '{"power":10,"speed":10,"spirit":10,"recovery":10}' NOT NULL,
	`current_room_id` text,
	`current_zone_id` text,
	`health` integer DEFAULT 100 NOT NULL,
	`max_health` integer DEFAULT 100 NOT NULL,
	`mana` integer DEFAULT 50 NOT NULL,
	`max_mana` integer DEFAULT 50 NOT NULL,
	`stamina` integer DEFAULT 100 NOT NULL,
	`max_stamina` integer DEFAULT 100 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`last_activity` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_characters_realm_player` ON `characters` (`realm_id`,`player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_characters_realm_name` ON `characters` (`realm_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_characters_realm_active` ON `characters` (`realm_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_characters_zone` ON `characters` (`current_zone_id`);--> statement-breakpoint
CREATE TABLE `market_listings` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text NOT NULL,
	`seller_character_id` text NOT NULL,
	`seller_character_name` text NOT NULL,
	`seller_player_id` text NOT NULL,
	`seller_player_username` text NOT NULL,
	`item_id` text NOT NULL,
	`item_data` text NOT NULL,
	`price` integer NOT NULL,
	`quantity` integer NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_market_server_item` ON `market_listings` (`server_id`,`item_id`);--> statement-breakpoint
CREATE INDEX `idx_market_server_status` ON `market_listings` (`server_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_market_seller` ON `market_listings` (`seller_character_id`);--> statement-breakpoint
CREATE INDEX `idx_market_expires` ON `market_listings` (`expires_at`);--> statement-breakpoint
CREATE TABLE `player_events` (
	`id` text PRIMARY KEY NOT NULL,
	`timestamp` integer NOT NULL,
	`player_id` text NOT NULL,
	`character_id` text,
	`realm_id` text,
	`event_type` text NOT NULL,
	`event_data` text NOT NULL,
	`year_month` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_events_timestamp` ON `player_events` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_events_player` ON `player_events` (`player_id`);--> statement-breakpoint
CREATE INDEX `idx_events_type` ON `player_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `idx_events_partition` ON `player_events` (`year_month`,`timestamp`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_login` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_username_unique` ON `players` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `players_email_unique` ON `players` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_players_username` ON `players` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_players_email` ON `players` (`email`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`token` text NOT NULL,
	`player_username` text NOT NULL,
	`realm_id` text,
	`character_id` text,
	`character_name` text,
	`device_info` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`last_activity` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sessions_token` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `idx_sessions_player` ON `sessions` (`player_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `ssh_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`name` text NOT NULL,
	`public_key` text NOT NULL,
	`fingerprint` text NOT NULL,
	`last_used` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ssh_keys_fingerprint_unique` ON `ssh_keys` (`fingerprint`);--> statement-breakpoint
CREATE INDEX `idx_ssh_keys_player` ON `ssh_keys` (`player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_ssh_keys_fingerprint` ON `ssh_keys` (`fingerprint`);