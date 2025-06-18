import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { holdings } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ message: "User ID is required" }, { status: 400 });
  }

  try {
    const userHoldings = await db
      .select()
      .from(holdings)
      .where(eq(holdings.userId, parseInt(userId)));
    
    return NextResponse.json({ holdings: userHoldings }, { status: 200 });
  } catch (error) {
    console.error("Error fetching holdings:", error);
    return NextResponse.json({ message: "Failed to fetch holdings" }, { status: 500 });
  }
}