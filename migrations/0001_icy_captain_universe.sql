ALTER TABLE `Stocks` RENAME COLUMN "StockName" TO "Name";--> statement-breakpoint
ALTER TABLE `Stocks` ALTER COLUMN "Name" TO "Name" text;