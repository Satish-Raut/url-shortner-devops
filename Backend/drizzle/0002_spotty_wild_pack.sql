CREATE TABLE `email_verification` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(8) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_verification_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_verification_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `email_verification_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `shortLinks` DROP FOREIGN KEY `shortLinks_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `email_verification` ADD CONSTRAINT `email_verification_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shortLinks` ADD CONSTRAINT `shortLinks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;