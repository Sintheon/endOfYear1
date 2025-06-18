import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { money, holdings, stocks, priceHistory, systemStats } from "@/src/db/schema";
import { eq, ne, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await db.transaction(async (trx) => {
      const recentPriceHistory = await trx
        .select()
        .from(priceHistory)
        .orderBy(desc(priceHistory.timestamp))
        .limit(2);

      await trx.delete(priceHistory);

      if (recentPriceHistory.length > 0) {
        for (const entry of recentPriceHistory) {
          await trx.insert(priceHistory).values({
            stock1: entry.stock1,
            stock2: entry.stock2,
            stock3: entry.stock3,
            stock4: entry.stock4,
            stock5: entry.stock5,
            timestamp: entry.timestamp
          });
        }
      }

      await trx.delete(holdings).where(ne(holdings.userId, 1));

      const users = await trx
        .select()
        .from(money)
        .where(ne(money.userId, 1));

      for (const user of users) {
        await trx
          .update(money)
          .set({ balance: 0 })
          .where(eq(money.userId, user.userId));
      }

      await trx.delete(systemStats);
      
      await trx.insert(systemStats).values({
        totalMoneyIssued: 0,
        timestamp: new Date().toISOString()
      });
    });

    return NextResponse.json({ 
      message: "Market reset successfully", 
      details: "All holdings cleared, user balances reset to 0, and system stats reset" 
    }, { status: 200 });
  } catch (error) {
    console.error("Error resetting market:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ message: "Failed to reset market", error: errorMessage }, { status: 500 });
  }
}