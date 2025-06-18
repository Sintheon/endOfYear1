import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { money, holdings, stocks } from "@/src/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const MAX_TOTAL_STOCKS = 5;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const { stockId, quantity, action } = await req.json();
    const userId = parseInt(session.user.id);

    if (!stockId || !quantity) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const stockIdNum = Number(stockId);
    const quantityNum = Number(quantity);

    if (isNaN(stockIdNum) || isNaN(quantityNum) || quantityNum <= 0) {
      return NextResponse.json({ message: "Invalid input values" }, { status: 400 });
    }

    if (action === "buy") {
      return await handleBuyTransaction(userId, stockIdNum, quantityNum);
    } else if (action === "sell") {
      return await handleSellTransaction(userId, stockIdNum, quantityNum);
    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Stock transaction error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred during the transaction";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

async function handleBuyTransaction(userId: number, stockId: number, quantity: number) {
  try {
    const stockData = await db
      .select()
      .from(stocks)
      .where(eq(stocks.stockId, stockId))
      .limit(1);
      
    if (stockData.length === 0) {
      return NextResponse.json({ message: "Stock not found" }, { status: 404 });
    }
    
    const stockPrice = stockData[0].CurrentPrice;
    const totalCost = Math.floor(stockPrice * quantity);
    
    await db.transaction(async (trx) => {
      const userData = await trx
        .select()
        .from(money)
        .where(eq(money.userId, userId))
        .limit(1);
        
      if (userData.length === 0) {
        throw new Error("User not found");
      }
      
      const userBalance = userData[0].balance;
      
      if (userBalance < totalCost) {
        throw new Error("Insufficient balance");
      }
      
      const existingHolding = await trx
        .select()
        .from(holdings)
        .where(
          and(
            eq(holdings.userId, userId),
            eq(holdings.stockId, stockId)
          )
        )
        .limit(1);
      
      const currentHoldings = await trx
        .select()
        .from(holdings)
        .where(eq(holdings.userId, userId));
        
      const totalStocksOwned = currentHoldings.reduce((sum, holding) => sum + holding.Amount, 0);
      
      let newTotalStocks = totalStocksOwned + quantity;
      
      if (existingHolding.length > 0) {
      }
      
      if (newTotalStocks > MAX_TOTAL_STOCKS) {
        throw new Error(`You cannot own more than ${MAX_TOTAL_STOCKS} total stocks. You currently own ${totalStocksOwned} stocks and are trying to buy ${quantity} more.`);
      }
      
      await trx
        .update(money)
        .set({ balance: userBalance - totalCost })
        .where(eq(money.userId, userId));
      
      if (existingHolding.length > 0) {
        const currentHolding = existingHolding[0];
        await trx
          .update(holdings)
          .set({
            Amount: currentHolding.Amount + quantity,
            moneySpent: currentHolding.moneySpent + totalCost
          })
          .where(
            and(
              eq(holdings.userId, userId),
              eq(holdings.stockId, stockId)
            )
          );
      } else {
        await trx
          .insert(holdings)
          .values({
            userId,
            stockId,
            Amount: quantity,
            moneySpent: totalCost
          });
      }
    });
    
    return NextResponse.json({ 
      message: `Successfully bought ${quantity} shares at $${stockPrice} each for a total of $${totalCost}` 
    }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    throw error;
  }
}

async function handleSellTransaction(userId: number, stockId: number, quantity: number) {
  try {
    const stockData = await db
      .select()
      .from(stocks)
      .where(eq(stocks.stockId, stockId))
      .limit(1);
      
    if (stockData.length === 0) {
      return NextResponse.json({ message: "Stock not found" }, { status: 404 });
    }
    
    const stockPrice = stockData[0].CurrentPrice;
    const saleValue = Math.floor(stockPrice * quantity);
    
    await db.transaction(async (trx) => {
      const existingHolding = await trx
        .select()
        .from(holdings)
        .where(
          and(
            eq(holdings.userId, userId),
            eq(holdings.stockId, stockId)
          )
        )
        .limit(1);
      
      if (existingHolding.length === 0) {
        throw new Error("You don't own any shares of this stock");
      }
      
      const currentHolding = existingHolding[0];
      
      if (currentHolding.Amount < quantity) {
        throw new Error(`You only have ${currentHolding.Amount} shares to sell`);
      }
      
      const avgCostPerShare = currentHolding.moneySpent / currentHolding.Amount;
      const moneySpentPortion = Math.floor(avgCostPerShare * quantity);
      
      if (currentHolding.Amount === quantity) {
        await trx
          .delete(holdings)
          .where(
            and(
              eq(holdings.userId, userId),
              eq(holdings.stockId, stockId)
            )
          );
      } else {
        await trx
          .update(holdings)
          .set({
            Amount: currentHolding.Amount - quantity,
            moneySpent: currentHolding.moneySpent - moneySpentPortion
          })
          .where(
            and(
              eq(holdings.userId, userId),
              eq(holdings.stockId, stockId)
            )
          );
      }
      
      const userData = await trx
        .select()
        .from(money)
        .where(eq(money.userId, userId))
        .limit(1);
        
      if (userData.length === 0) {
        throw new Error("User not found");
      }
      
      await trx
        .update(money)
        .set({ balance: userData[0].balance + saleValue })
        .where(eq(money.userId, userId));
    });
    
    return NextResponse.json({ 
      message: `Successfully sold ${quantity} shares at $${stockPrice} each for a total of $${saleValue}` 
    }, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    throw error;
  }
}