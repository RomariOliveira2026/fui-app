ALTER TABLE `rides` ADD `scheduledFor` timestamp;--> statement-breakpoint
ALTER TABLE `rides` ADD `isScheduled` enum('yes','no') DEFAULT 'no' NOT NULL;--> statement-breakpoint
ALTER TABLE `rides` DROP COLUMN `requestedAt`;--> statement-breakpoint
ALTER TABLE `rides` DROP COLUMN `acceptedAt`;--> statement-breakpoint
ALTER TABLE `rides` DROP COLUMN `startedAt`;