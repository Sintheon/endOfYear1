import { NextResponse } from "next/server";
import { db } from "@/src/db"; 
import { money, systemStats } from "@/src/db/schema"; 
import { eq, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { senderId, targetId, amount } = await req.json();

    if (!senderId || !targetId || amount === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const senderIdNum = Number(senderId);
    const targetIdNum = Number(targetId);
    const parsedAmount = Number(amount);

    if (isNaN(senderIdNum) || isNaN(targetIdNum) || isNaN(parsedAmount)) {
      return NextResponse.json({ message: "Invalid input values" }, { status: 400 });
    }

    const isAdmin = senderIdNum === 1;

    if (!isAdmin && parsedAmount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    await db.transaction(async (trx) => {
      const targetUsers = await trx
        .select()
        .from(money)
        .where(eq(money.userId, targetIdNum))
        .limit(1);

      if (targetUsers.length === 0) {
        throw new Error("Target user not found");
      }
      
      const targetUser = targetUsers[0];

      if (isAdmin) {
        const currentStats = await trx
          .select()
          .from(systemStats)
          .orderBy(desc(systemStats.id))
          .limit(1);
        
        const previousTotal = currentStats.length > 0 ? currentStats[0].totalMoneyIssued : 0;
        const newTotal = parsedAmount > 0 ? previousTotal + parsedAmount : previousTotal;
        
        await trx
          .insert(systemStats)
          .values({
            totalMoneyIssued: newTotal,
            timestamp: new Date().toISOString()
          });
      } else {
        const senderUsers = await trx
          .select()
          .from(money)
          .where(eq(money.userId, senderIdNum))
          .limit(1);

        if (senderUsers.length === 0) {
          throw new Error("Sender user not found");
        }
        
        const senderUser = senderUsers[0];

        if (senderUser.balance < parsedAmount) {
          throw new Error("Insufficient balance");
        }

        await trx
          .update(money)
          .set({ balance: senderUser.balance - parsedAmount })
          .where(eq(money.userId, senderIdNum));
      }

      await trx
        .update(money)
        .set({ balance: targetUser.balance + parsedAmount })
        .where(eq(money.userId, targetIdNum));
    });

    return NextResponse.json({ message: "Transfer successful" }, { status: 200 });
  } catch (error) {
    console.error("Transfer error:", error);

    const errorMessage = error instanceof Error ? error.message : "An error occurred during the transfer";

    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}