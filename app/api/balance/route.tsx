import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { money } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const requestedUserId = url.searchParams.get("userId");

    if (
      requestedUserId && 
      requestedUserId !== session.user.id && 
      session.user.id !== "1"
    ) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = requestedUserId || session.user.id;
    
    const userBalance = await db
      .select()
      .from(money)
      .where(eq(money.userId, Number(userId)))
      .limit(1);

    if (userBalance.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ balance: userBalance[0].balance }, { status: 200 });
  } catch (error) {
    console.error("Balance API error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}