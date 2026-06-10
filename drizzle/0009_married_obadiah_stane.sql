CREATE TABLE `saved_addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` enum('home','work','other') NOT NULL,
	`customLabel` varchar(50),
	`address` text NOT NULL,
	`lat` varchar(20) NOT NULL,
	`lng` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_addresses_id` PRIMARY KEY(`id`)
);
