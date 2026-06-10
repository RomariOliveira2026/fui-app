ALTER TABLE `rides` MODIFY COLUMN `paymentMethod` enum('pix','card','cash') NOT NULL;--> statement-breakpoint
ALTER TABLE `rides` MODIFY COLUMN `paymentStatus` enum('pending','paid','failed') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `rides` ADD `couponId` int;--> statement-breakpoint
ALTER TABLE `rides` ADD `couponCode` varchar(50);--> statement-breakpoint
ALTER TABLE `rides` ADD `discountAmount` int DEFAULT 0 NOT NULL;