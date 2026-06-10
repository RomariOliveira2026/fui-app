CREATE TABLE `loyalty_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('earned','redeemed','expired') NOT NULL,
	`points` int NOT NULL,
	`description` text NOT NULL,
	`rideId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `loyalty_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `loyaltyPoints` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `vipLevel` enum('bronze','prata','ouro','diamante') DEFAULT 'bronze' NOT NULL;