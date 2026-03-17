import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { stocks, priceHistory } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const stocksData = await db.select().from(stocks);
    
    return NextResponse.json({ stocks: stocksData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return NextResponse.json({ message: "Failed to fetch stocks" }, { status: 500 });
  }
}

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
    
    const initialPrices = await db
      .select()
      .from(priceHistory)
      .orderBy(desc(priceHistory.timestamp))
      .limit(1000);
    
    const firstPriceRecord = initialPrices.length > 0 ? initialPrices[initialPrices.length - 1] : null;
    
    const updatedStocks = await Promise.all(
      currentStocks.map(async (stock) => {
        let initialPrice = null;
        if (firstPriceRecord) {
          switch (stock.stockId) {
            case 1: initialPrice = firstPriceRecord.stock1; break;
            case 2: initialPrice = firstPriceRecord.stock2; break;
            case 3: initialPrice = firstPriceRecord.stock3; break;
            case 4: initialPrice = firstPriceRecord.stock4; break;
            case 5: initialPrice = firstPriceRecord.stock5; break;
          }
        }
        const changePercent = generateImprovedPriceChange(stock.CurrentPrice, initialPrice);
        
        const newPrice = Math.max(
          1,
          Math.round(stock.CurrentPrice * (1 + changePercent / 100))
        );
        
        await db
          .update(stocks)
          .set({ 
            LastPrice: stock.CurrentPrice,
            CurrentPrice: newPrice 
          })
          .where(eq(stocks.stockId, stock.stockId));
        
        return {
          stockId: stock.stockId,
          stockName: stock.Name,
          previousPrice: stock.CurrentPrice,
          newPrice: newPrice,
          changePercent: changePercent
        };
      })
    );
    
    return NextResponse.json({ 
      message: "Stock prices updated successfully",
      updates: updatedStocks
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating stock prices:", error);
    return NextResponse.json({ message: "Failed to update stock prices" }, { status: 500 });
  }
}

function generateImprovedPriceChange(currentPrice: number, initialPrice: number | null): number {
  if (initialPrice !== null) {
    const percentFromInitial = ((currentPrice - initialPrice) / initialPrice) * 100;
    if (percentFromInitial < -25) {
      if (Math.random() < 0.7) {
        return 5 + Math.random() * 10;
      }
    }
    if (percentFromInitial > 25) {
      if (Math.random() < 0.7) {
        return -(5 + Math.random() * 10);
      }
    }
    if (percentFromInitial > 100) {
      if (Math.random() < 0.85) {
        return -(8 + Math.random() * 12);
      }
    }
  }
  return generateRangeBasedPriceChange();
}

function generateRangeBasedPriceChange(): number {
  const random = Math.random() * 100;
  let changePercent = 0;
  
  if (random < 50) {
    changePercent = Math.random() * 5;
  } else if (random < 75) {
    changePercent = 5 + Math.random() * 5;
  } else if (random < 90) {
    changePercent = 10 + Math.random() * 5;
  } else {
    changePercent = 15 + Math.random() * 5;
  }
  
  if (Math.random() < 0.5) {
    changePercent = -changePercent;
  }
  
  return Math.round(changePercent * 100) / 100;
}