-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `actions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`action` varchar(45) NOT NULL,
	CONSTRAINT `actions_id` PRIMARY KEY(`id`),
	CONSTRAINT `action_UNIQUE` UNIQUE(`action`)
);
--> statement-breakpoint
CREATE TABLE `clearing_houses` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`clearing_house_name` varchar(45) NOT NULL,
	CONSTRAINT `clearing_houses_id` PRIMARY KEY(`id`),
	CONSTRAINT `id_UNIQUE` UNIQUE(`id`),
	CONSTRAINT `clearing_house_name_UNIQUE` UNIQUE(`clearing_house_name`)
);
--> statement-breakpoint
CREATE TABLE `ehr_systems` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`system_name` varchar(45) NOT NULL,
	CONSTRAINT `ehr_systems_id` PRIMARY KEY(`id`),
	CONSTRAINT `id_UNIQUE` UNIQUE(`id`),
	CONSTRAINT `system_name_UNIQUE` UNIQUE(`system_name`)
);
--> statement-breakpoint
CREATE TABLE `follow_up_reasons` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`reason` varchar(45) NOT NULL,
	CONSTRAINT `follow_up_reasons_id` PRIMARY KEY(`id`),
	CONSTRAINT `reason_UNIQUE` UNIQUE(`reason`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`practice_id` int unsigned,
	`provider_id` int unsigned,
	`user_id` int unsigned NOT NULL,
	`timestamp` date NOT NULL,
	`note` text NOT NULL,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `id_UNIQUE` UNIQUE(`id`)
);
--> statement-breakpoint
CREATE TABLE `pm_systems` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`system_name` varchar(45) NOT NULL,
	CONSTRAINT `pm_systems_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_name_UNIQUE` UNIQUE(`system_name`)
);
--> statement-breakpoint
CREATE TABLE `practices` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`npi` varchar(10),
	`name` varchar(100) NOT NULL,
	`address1` varchar(255),
	`address2` varchar(255),
	`city` varchar(100) NOT NULL,
	`state` char(2) NOT NULL,
	`zip` varchar(10),
	`phone` varchar(15),
	`fax` varchar(15),
	`specialization` varchar(100),
	`status_id` int unsigned,
	`action_id` int unsigned,
	`follow_up_date` date,
	`follow_up_reason_id` int unsigned,
	`ehr_system_id` int unsigned,
	`pm_system_id` int unsigned,
	CONSTRAINT `practices_id` PRIMARY KEY(`id`),
	CONSTRAINT `name_UNIQUE` UNIQUE(`name`),
	CONSTRAINT `NPI_UNIQUE` UNIQUE(`npi`)
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`npi` varchar(10),
	`first_name` varchar(100) NOT NULL,
	`middle_name` varchar(100),
	`last_name` varchar(100) NOT NULL,
	`direct_email` varchar(255),
	`address1` varchar(255),
	`address2` varchar(255),
	`city` varchar(100),
	`state` char(2),
	`zip` varchar(10),
	`phone` varchar(15),
	`fax` varchar(15),
	`specialization` varchar(100),
	`practice_id` int unsigned NOT NULL,
	`sales_rep_id` int unsigned,
	`status_id` int unsigned,
	`action_id` int unsigned,
	`follow_up_date` date,
	`follow_up_reason_id` int unsigned,
	CONSTRAINT `providers_id` PRIMARY KEY(`id`),
	CONSTRAINT `NPI_UNIQUE` UNIQUE(`npi`)
);
--> statement-breakpoint
CREATE TABLE `statuses` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`status` varchar(45) NOT NULL,
	CONSTRAINT `statuses_id` PRIMARY KEY(`id`),
	CONSTRAINT `status_UNIQUE` UNIQUE(`status`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`email` varchar(254) NOT NULL,
	`password` char(60) NOT NULL,
	`reset_token` varchar(45),
	`reset_token_expiration` datetime,
	`first_name` varchar(45) NOT NULL,
	`last_name` varchar(45) NOT NULL,
	`sales_rep` tinyint(1) NOT NULL DEFAULT 0,
	`access_level` tinyint unsigned NOT NULL DEFAULT 3,
	`active` tinyint NOT NULL DEFAULT 1,
	`created` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`updated` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_UNIQUE` UNIQUE(`email`),
	CONSTRAINT `reset_token_UNIQUE` UNIQUE(`reset_token`)
);
--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`practice_id`) REFERENCES `practices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `notes_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practices` ADD CONSTRAINT `fk_practice_action` FOREIGN KEY (`action_id`) REFERENCES `actions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practices` ADD CONSTRAINT `fk_practice_ehr_system` FOREIGN KEY (`ehr_system_id`) REFERENCES `ehr_systems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practices` ADD CONSTRAINT `fk_practice_follow_up_reason` FOREIGN KEY (`follow_up_reason_id`) REFERENCES `follow_up_reasons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practices` ADD CONSTRAINT `fk_practice_pm_system` FOREIGN KEY (`pm_system_id`) REFERENCES `pm_systems`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `practices` ADD CONSTRAINT `fk_practice_status` FOREIGN KEY (`status_id`) REFERENCES `statuses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `providers` ADD CONSTRAINT `fk_provider_action` FOREIGN KEY (`action_id`) REFERENCES `actions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `providers` ADD CONSTRAINT `fk_provider_follow_up_reason` FOREIGN KEY (`follow_up_reason_id`) REFERENCES `follow_up_reasons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `providers` ADD CONSTRAINT `fk_provider_practice` FOREIGN KEY (`practice_id`) REFERENCES `practices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `providers` ADD CONSTRAINT `fk_provider_sales_rep` FOREIGN KEY (`sales_rep_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `providers` ADD CONSTRAINT `fk_provider_status` FOREIGN KEY (`status_id`) REFERENCES `statuses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `practice_id` ON `notes` (`practice_id`);--> statement-breakpoint
CREATE INDEX `provider_id` ON `notes` (`provider_id`);--> statement-breakpoint
CREATE INDEX `specialization` ON `practices` (`specialization`);--> statement-breakpoint
CREATE INDEX `status` ON `practices` (`status_id`);--> statement-breakpoint
CREATE INDEX `action` ON `practices` (`action_id`);--> statement-breakpoint
CREATE INDEX `ehr_system` ON `practices` (`ehr_system_id`);--> statement-breakpoint
CREATE INDEX `pm_system` ON `practices` (`pm_system_id`);--> statement-breakpoint
CREATE INDEX `fk_practice_follow_up_reason_idx` ON `practices` (`follow_up_reason_id`);--> statement-breakpoint
CREATE INDEX `name` ON `practices` (`name`,`specialization`,`city`,`state`,`npi`);--> statement-breakpoint
CREATE INDEX `practice` ON `providers` (`practice_id`);--> statement-breakpoint
CREATE INDEX `sales_rep` ON `providers` (`sales_rep_id`);--> statement-breakpoint
CREATE INDEX `status` ON `providers` (`status_id`);--> statement-breakpoint
CREATE INDEX `action` ON `providers` (`action_id`);--> statement-breakpoint
CREATE INDEX `follow_up_reason` ON `providers` (`follow_up_reason_id`);--> statement-breakpoint
CREATE INDEX `first_name` ON `providers` (`first_name`,`middle_name`,`last_name`,`specialization`,`city`,`state`,`npi`);
*/