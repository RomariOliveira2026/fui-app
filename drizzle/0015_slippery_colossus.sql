CREATE TABLE `emergency_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`relationship` varchar(100),
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emergency_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sos_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rideId` int NOT NULL,
	`userId` int NOT NULL,
	`location` text,
	`lat` varchar(20),
	`lng` varchar(20),
	`status` enum('active','resolved','false_alarm') NOT NULL DEFAULT 'active',
	`notes` text,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sos_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rides` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `rides` ADD `sosActivated` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `rides` ADD `sosActivatedAt` timestamp;