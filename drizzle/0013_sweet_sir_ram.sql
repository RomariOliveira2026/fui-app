CREATE TABLE `ride_passengers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rideId` int NOT NULL,
	`passengerId` int NOT NULL,
	`status` enum('pending','accepted','declined','cancelled') NOT NULL DEFAULT 'pending',
	`pickupAddress` text NOT NULL,
	`pickupLat` varchar(20) NOT NULL,
	`pickupLng` varchar(20) NOT NULL,
	`dropoffAddress` text NOT NULL,
	`dropoffLat` varchar(20) NOT NULL,
	`dropoffLng` varchar(20) NOT NULL,
	`individualPrice` int NOT NULL,
	`pickupOrder` int NOT NULL DEFAULT 1,
	`dropoffOrder` int NOT NULL DEFAULT 1,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`pickedUpAt` timestamp,
	`droppedOffAt` timestamp,
	CONSTRAINT `ride_passengers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rides` ADD `isShared` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `rides` ADD `maxPassengers` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `rides` ADD `currentPassengers` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `rides` ADD `pricePerPassenger` int;