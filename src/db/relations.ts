import { relations } from "drizzle-orm/relations";
import { signIn, holdings, stocks, money } from "./schema";

export const holdingsRelations = relations(holdings, ({one}) => ({
	signIn: one(signIn, {
		fields: [holdings.userId],
		references: [signIn.userId]
	}),
	stock: one(stocks, {
		fields: [holdings.stockId],
		references: [stocks.stockId]
	}),
}));

export const signInRelations = relations(signIn, ({many}) => ({
	holdings: many(holdings),
	monies: many(money),
}));

export const stocksRelations = relations(stocks, ({many}) => ({
	holdings: many(holdings),
}));

export const moneyRelations = relations(money, ({one}) => ({
	signIn: one(signIn, {
		fields: [money.userId],
		references: [signIn.userId]
	}),
}));