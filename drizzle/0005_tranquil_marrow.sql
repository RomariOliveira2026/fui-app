CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rideId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderRole` enum('driver','passenger') NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
