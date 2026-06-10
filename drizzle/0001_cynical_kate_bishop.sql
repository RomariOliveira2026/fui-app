CREATE TABLE `driver_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`lat` varchar(20) NOT NULL,
	`lng` varchar(20) NOT NULL,
	`heading` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `driver_locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `driver_locations_driverId_unique` UNIQUE(`driverId`)
);
--> statement-breakpoint
CREATE TABLE `driver_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cpf` varchar(14),
	`cnh` varchar(20),
	`cnhImageUrl` text,
	`status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`rating` int DEFAULT 0,
	`totalRides` int DEFAULT 0,
	`isAvailable` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `driver_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleType` enum('moto','carro','van') NOT NULL,
	`basePrice` int NOT NULL,
	`pricePerKm` int NOT NULL,
	`pricePerMinute` int NOT NULL,
	`minimumPrice` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricing_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `pricing_config_vehicleType_unique` UNIQUE(`vehicleType`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rideId` int NOT NULL,
	`fromUserId` int NOT NULL,
	`toUserId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`passengerId` int NOT NULL,
	`driverId` int,
	`vehicleId` int,
	`status` enum('requested','accepted','in_progress','completed','cancelled') NOT NULL DEFAULT 'requested',
	`vehicleType` enum('moto','carro','van') NOT NULL,
	`originAddress` text NOT NULL,
	`originLat` varchar(20) NOT NULL,
	`originLng` varchar(20) NOT NULL,
	`destinationAddress` text NOT NULL,
	`destinationLat` varchar(20) NOT NULL,
	`destinationLng` varchar(20) NOT NULL,
	`distance` int,
	`duration` int,
	`estimatedPrice` int,
	`finalPrice` int,
	`paymentMethod` enum('pix','card','cash'),
	`paymentStatus` enum('pending','paid','failed') DEFAULT 'pending',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`cancelledAt` timestamp,
	`cancelledBy` int,
	`cancellationReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`type` enum('moto','carro','van') NOT NULL,
	`brand` varchar(100),
	`model` varchar(100),
	`year` int,
	`plate` varchar(10) NOT NULL,
	`color` varchar(50),
	`photoUrl` text,
	`status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','driver','passenger') NOT NULL DEFAULT 'passenger';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;