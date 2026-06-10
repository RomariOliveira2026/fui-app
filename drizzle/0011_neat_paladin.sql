ALTER TABLE `rides` MODIFY COLUMN `vehicleType` enum('moto','carro','van','utilitario') NOT NULL;--> statement-breakpoint
ALTER TABLE `vehicles` MODIFY COLUMN `type` enum('moto','carro','van','utilitario') NOT NULL;--> statement-breakpoint
ALTER TABLE `rides` ADD `isFreight` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `rides` ADD `cargoWeight` int;--> statement-breakpoint
ALTER TABLE `rides` ADD `cargoType` varchar(100);--> statement-breakpoint
ALTER TABLE `rides` ADD `cargoDescription` text;--> statement-breakpoint
ALTER TABLE `rides` ADD `needsHelpers` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `rides` ADD `numberOfHelpers` int DEFAULT 0;