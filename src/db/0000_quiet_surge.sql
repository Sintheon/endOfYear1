-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `SignIn` (
	`UserID` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`PlayerName` text NOT NULL,
	`Password` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `PriceHistory` (
	`Stock1` integer NOT NULL,
	`Stock2` integer NOT NULL,
	`Stock3` integer NOT NULL,
	`Stock4` integer NOT NULL,
	`Stock5` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Stocks` (
	`StockID` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`CurrentPrice` integer NOT NULL,
	`LastPrice` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Holdings` (
	`UserID` integer NOT NULL,
	`StockID` integer NOT NULL,
	`Amount` integer NOT NULL,
	`MoneySpent` integer NOT NULL,
	FOREIGN KEY (`UserID`) REFERENCES `SignIn`(`UserID`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`StockID`) REFERENCES `Stocks`(`StockID`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Money` (
	`UserID` integer NOT NULL,
	`Balance` integer NOT NULL,
	FOREIGN KEY (`UserID`) REFERENCES `SignIn`(`UserID`) ON UPDATE no action ON DELETE no action
);

*/