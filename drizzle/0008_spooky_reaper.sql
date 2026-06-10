ALTER TABLE `chat_messages` MODIFY COLUMN `message` text;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `audioUrl` text;--> statement-breakpoint
ALTER TABLE `chat_messages` DROP COLUMN `senderRole`;