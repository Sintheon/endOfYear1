import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { priceHistory, stocks } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    
    const apiKey = process.env.ADMIN_API_KEY;
    if (body?.adminKey && apiKey && body.adminKey === apiKey) {

    } else {
      const session = await getServerSession(authOptions);
      if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    const currentStocks = await db.select().from(stocks);
    
    if (currentStocks.length !== 5) {
      return NextResponse.json({ message: "Expected 5 stocks in the system" }, { status: 400 });
    }
    
    await db.insert(priceHistory).values({
      stock1: currentStocks[0].CurrentPrice,
      stock2: currentStocks[1].CurrentPrice,
      stock3: currentStocks[2].CurrentPrice,
      stock4: currentStocks[3].CurrentPrice,
      stock5: currentStocks[4].CurrentPrice,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ 
      message: "Price history recorded successfully" 
    }, { status: 200 });
  } catch (error) {
    console.error("Error recording price history:", error);
    return NextResponse.json({ message: "Failed to record price history" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 10;

    const stocksData = await db.select().from(stocks);
    const stockNames = stocksData.reduce((acc, stock) => {
      acc[`stock${stock.stockId}`] = stock.Name || 'Unknown';
      return acc;
    }, {} as Record<string, string>);

    let query = db.select().from(priceHistory).orderBy(desc(priceHistory.timestamp));
    
    if (limit > 0) {
      query = (query as any).limit(limit);
    }

    const historyRecords = await query;
    
    const formattedHistory = historyRecords.map(record => {
      const date = new Date(record.timestamp);
      return {
        timestamp: record.timestamp,
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
        prices: {
          [stockNames.stock1 || 'Stock 1']: record.stock1,
          [stockNames.stock2 || 'Stock 2']: record.stock2,
          [stockNames.stock3 || 'Stock 3']: record.stock3,
          [stockNames.stock4 || 'Stock 4']: record.stock4,
          [stockNames.stock5 || 'Stock 5']: record.stock5,
        },
        priceArray: [
          record.stock1,
          record.stock2,
          record.stock3,
          record.stock4,
          record.stock5
        ]
      };
    });

    return NextResponse.json({ 
      history: formattedHistory,
      stockNames
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching price history:", error);
    return NextResponse.json({ message: "Failed to fetch price history" }, { status: 500 });
  }
}