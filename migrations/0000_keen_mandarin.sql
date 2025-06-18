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
--> statement-breakpoint
CREATE TABLE `PriceHistory` (
	`Stock1` integer NOT NULL,
	`Stock2` integer NOT NULL,
	`Stock3` integer NOT NULL,
	`Stock4` integer NOT NULL,
	`Stock5` integer NOT NULL,
	`Timestamp` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `SignIn` (
	`UserID` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`PlayerName` text NOT NULL,
	`Password` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Stocks` (
	`StockID` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`CurrentPrice` integer NOT NULL,
	`LastPrice` integer NOT NULL,
	`StockName` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `SystemStats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`TotalMoneyIssued` integer NOT NULL,
	`Timestamp` text NOT NULL
);
