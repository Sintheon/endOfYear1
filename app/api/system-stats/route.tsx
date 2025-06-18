import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { money, signIn, systemStats } from "@/src/db/schema";
import { desc, eq, ne, sum } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const latestStatsRecord = await db
      .select()
      .from(systemStats)
      .orderBy(desc(systemStats.id))
      .limit(1);

    const totalMoneyIssued = latestStatsRecord.length > 0 ? latestStatsRecord[0].totalMoneyIssued : 0;

    const userBalances = await db
      .select()
      .from(money)
      .where(ne(money.userId, 1));

    const totalUserBalance = userBalances.reduce((sum, user) => sum + user.balance, 0);

    const richestUser = await db
      .select({
        userId: money.userId,
        balance: money.balance,
        playerName: signIn.playerName
      })
      .from(money)
      .innerJoin(signIn, eq(money.userId, signIn.userId))
      .where(ne(money.userId, 1))
      .orderBy(desc(money.balance))
      .limit(1);

    return NextResponse.json({ 
      systemStats: {
        totalMoneyIssued,
        totalUserBalance,
        netBalance: totalUserBalance - totalMoneyIssued
      },
      richestUser: richestUser.length > 0 ? richestUser[0] : null
    }, { status: 200 });
  } catch (error) {
    console.error("System stats API error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}