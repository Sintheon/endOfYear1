import { sqliteTable, AnySQLiteColumn, integer, text, foreignKey } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const signIn = sqliteTable("SignIn", {
	userId: integer("UserID").primaryKey({ autoIncrement: true }).notNull(),
	playerName: text("PlayerName").notNull(),
	password: text("Password").notNull(),
});

export const priceHistory = sqliteTable("PriceHistory", {
	stock1: integer("Stock1").notNull(),
	stock2: integer("Stock2").notNull(),
	stock3: integer("Stock3").notNull(),
	stock4: integer("Stock4").notNull(),
	stock5: integer("Stock5").notNull(),
	timestamp: text("Timestamp").notNull(),
});

export const stocks = sqliteTable("Stocks", {
	stockId: integer("StockID").primaryKey({ autoIncrement: true }).notNull(),
	CurrentPrice: integer("CurrentPrice").notNull(),
	LastPrice: integer("LastPrice").notNull(),
	Name: text("Name"),
  });

export const holdings = sqliteTable("Holdings", {
	userId: integer("UserID").notNull().references(() => signIn.userId),
	stockId: integer("StockID").notNull().references(() => stocks.stockId),
	Amount: integer("Amount").notNull(),
	moneySpent: integer("MoneySpent").notNull(),
});

export const money = sqliteTable("Money", {
	userId: integer("UserID").notNull().references(() => signIn.userId),
	balance: integer("Balance").notNull(),
});

export const systemStats = sqliteTable("SystemStats", {
	id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
	totalMoneyIssued: integer("TotalMoneyIssued").notNull(),
	timestamp: text("Timestamp").notNull(),
  });
