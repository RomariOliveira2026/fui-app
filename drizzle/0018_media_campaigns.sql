CREATE TABLE `media_partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`brandLabel` varchar(160),
	`contactName` varchar(120),
	`contactEmail` varchar(320),
	`contactWhatsapp` varchar(20),
	`city` varchar(80) NOT NULL,
	`state` varchar(2) NOT NULL,
	`category` enum('food','retail','services','mobility','events','local_business','corporate') NOT NULL,
	`status` enum('prospect','active','paused') NOT NULL DEFAULT 'prospect',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` enum('food','retail','services','mobility','events','local_business','corporate') NOT NULL,
	`status` enum('draft','scheduled','active','paused','ended') NOT NULL DEFAULT 'draft',
	`targetCities` json DEFAULT ('[]'),
	`budgetCents` int,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`creatives` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `media_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaign_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`creativeId` int NOT NULL,
	`partnerId` int NOT NULL,
	`eventType` enum('impression','click') NOT NULL,
	`placement` varchar(32) NOT NULL,
	`city` varchar(80),
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaign_events_id` PRIMARY KEY(`id`)
);
