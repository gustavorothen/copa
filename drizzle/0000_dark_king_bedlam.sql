CREATE TABLE `championships` (
	`owner` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
