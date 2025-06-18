"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Stock = {
  stockId: number;
  CurrentPrice: number;
  LastPrice: number;
  Name?: string;
};

type UserHolding = {
  stockId: number;
  Amount: number;
  moneySpent: number;
};

const MAX_TOTAL_STOCKS = 5;

const StocksPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [userHoldings, setUserHoldings] = useState<UserHolding[]>([]);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [selectedStock, setSelectedStock] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"market" | "portfolio">("market");
  const [sellModalOpen, setSellModalOpen] = useState<boolean>(false);
  const [selectedHolding, setSelectedHolding] = useState<UserHolding | null>(null);
  const [sellQuantity, setSellQuantity] = useState<string>("1");

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/bankas");
      return;
    }

    loadData();
  }, [session, status, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStocks(),
        fetchUserHoldings(),
        fetchUserBalance()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStocks = async () => {
    try {
      const response = await fetch("/api/stocks");
      if (response.ok) {
        const data = await response.json();
        setStocks(data.stocks);
      }
    } catch (error) {
      console.error("Failed to fetch stocks:", error);
      setError("Failed to load stocks data");
    }
  };

  const fetchUserHoldings = async () => {
    try {
      const response = await fetch(`/api/holdings?userId=${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserHoldings(data.holdings);
      }
    } catch (error) {
      console.error("Failed to fetch holdings:", error);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await fetch(`/api/balance?userId=${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const handleTransaction = async () => {
    if (!selectedStock || !quantity) {
      setError("Please select a stock and quantity");
      return;
    }

    try {
      const response = await fetch("/api/stock-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockId: selectedStock,
          quantity: parseInt(quantity),
          action: action,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess(result.message);
        setError("");
        await loadData();
        
        setQuantity("1");
      } else {
        setError(result.message);
        setSuccess("");
      }
    } catch (error) {
      setError("An error occurred during the transaction");
      setSuccess("");
    }
  };

  const handleDirectSell = async () => {
    if (!selectedHolding || !sellQuantity) {
      setError("Please select a valid quantity to sell");
      return;
    }

    try {
      const response = await fetch("/api/stock-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockId: selectedHolding.stockId,
          quantity: parseInt(sellQuantity),
          action: "sell",
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccess(result.message);
        setError("");
        closeSellModal();
        await loadData();
      } else {
        setError(result.message);
        setSuccess("");
      }
    } catch (error) {
      setError("An error occurred during the sell transaction");
      setSuccess("");
    }
  };

  const openSellModal = (holding: UserHolding) => {
    setSelectedHolding(holding);
    setSellQuantity("1");
    setSellModalOpen(true);
    setError("");
    setSuccess("");
  };

  const closeSellModal = () => {
    setSellModalOpen(false);
    setSelectedHolding(null);
    setSellQuantity("1");
  };

  const totalStocksOwned = userHoldings.reduce((sum, holding) => sum + holding.Amount, 0);
  
  const hasReachedStockLimit = totalStocksOwned >= MAX_TOTAL_STOCKS;
  
  const remainingStocksAllowed = MAX_TOTAL_STOCKS - totalStocksOwned;
  
  const isBuyingDisabled = action === 'buy' && hasReachedStockLimit;
  
  useEffect(() => {
    if (action === 'buy' && parseInt(quantity) > remainingStocksAllowed && remainingStocksAllowed > 0) {
      setQuantity(remainingStocksAllowed.toString());
    }
  }, [action, quantity, remainingStocksAllowed]);

  if (loading) {
    return <div className="p-4">Loading stocks data...</div>;
  }

  return (
    <div className="container mx-auto p-2">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Stock Market</h1>
      
      {}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <p className="font-medium">Your Balance: <span className="font-bold">${userBalance.toLocaleString()}</span></p>
        <p className="text-sm mt-1">
          <span className={hasReachedStockLimit ? "text-red-600 font-bold" : ""}>
            Total stocks owned: {totalStocksOwned}/{MAX_TOTAL_STOCKS}
          </span>
          {hasReachedStockLimit && (
            <span className="text-red-600 font-bold ml-1">
              (Maximum limit reached. You must sell some stocks before buying more.)
            </span>
          )}
          {!hasReachedStockLimit && remainingStocksAllowed > 0 && (
            <span className="text-green-600 ml-1">
              (You can buy {remainingStocksAllowed} more stocks)
            </span>
          )}
        </p>
      </div>
      
      {}
      <div className="flex mb-4">
        <button 
          className={`flex-1 py-2 ${activeTab === 'market' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('market')}
        >
          Market
        </button>
        <button 
          className={`flex-1 py-2 ${activeTab === 'portfolio' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio ({totalStocksOwned}/{MAX_TOTAL_STOCKS})
        </button>
      </div>
      
      {}
      {activeTab === 'market' && (
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-2">Available Stocks</h2>
          <div className="bg-gray-100 p-3 rounded-lg mb-4">
            {stocks.map((stock) => {
              const priceChange = ((stock.CurrentPrice - stock.LastPrice) / stock.LastPrice) * 100;
              const changeColor = priceChange >= 0 ? "text-green-600" : "text-red-600";
              const isOwned = userHoldings.some(h => h.stockId === stock.stockId);
              
              return (
                <div 
                  key={stock.stockId} 
                  className={`p-3 border-b ${selectedStock === stock.stockId ? 'bg-blue-100' : ''}`}
                  onClick={() => setSelectedStock(stock.stockId)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {stock.Name || `Stock ${stock.stockId}`}
                        {isOwned && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Owned</span>}
                      </div>
                      <div className={`text-sm ${changeColor}`}>
                        {priceChange.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-right font-bold">
                      ${stock.CurrentPrice}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mb-4">
            <h2 className="text-lg md:text-xl font-semibold mb-2">Trade Stocks</h2>
            <div className="bg-gray-100 p-3 rounded-lg">
              {/* Stock Limit Warning */}
              {hasReachedStockLimit && (
                <div className="mb-3 p-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                  <p className="font-bold">📢 Stock Limit Reached</p>
                  <p>You already own {totalStocksOwned} total stocks (maximum limit is {MAX_TOTAL_STOCKS}). You need to sell some stocks before you can buy more.</p>
                </div>
              )}
              
              {!hasReachedStockLimit && remainingStocksAllowed > 0 && (
                <div className="mb-3 p-2 bg-blue-50 text-blue-800 rounded-lg text-sm">
                  <p>You can buy up to {remainingStocksAllowed} more stocks.</p>
                </div>
              )}
              
              <div className="mb-3">
                <label className="block mb-1">Action:</label>
                <div className="flex">
                  <button 
                    className={`flex-1 py-2 ${action === 'buy' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setAction('buy')}
                  >
                    Buy
                  </button>
                  <button 
                    className={`flex-1 py-2 ${action === 'sell' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setAction('sell')}
                  >
                    Sell
                  </button>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block mb-1">Selected Stock:</label>
                <p className="font-medium">
                  {selectedStock ? (
                    <>
                      {stocks.find(s => s.stockId === selectedStock)?.Name || `Stock ${selectedStock}`}
                      {userHoldings.some(h => h.stockId === selectedStock) && 
                        <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Already Owned</span>
                      }
                    </>
                  ) : 'None'}
                </p>
              </div>
              
              <div className="mb-3">
                <label htmlFor="quantity" className="block mb-1">
                  Quantity:
                  {action === 'buy' && remainingStocksAllowed > 0 && !hasReachedStockLimit && (
                    <span className="text-xs text-blue-600 ml-2">
                      (Max: {remainingStocksAllowed})
                    </span>
                  )}
                </label>
                <input 
                  type="number" 
                  id="quantity"
                  min="1"
                  max={action === 'buy' ? remainingStocksAllowed : undefined}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (action === 'buy' && val > remainingStocksAllowed) {
                      setQuantity(remainingStocksAllowed.toString());
                    } else {
                      setQuantity(e.target.value);
                    }
                  }}
                  className="border p-2 w-full rounded"
                  disabled={action === 'buy' && hasReachedStockLimit}
                />
              </div>
              
              {selectedStock && (
                <div className="mb-3">
                  <p>
                    Transaction Total: 
                    <span className="font-bold ml-1">
                      ${(parseInt(quantity) * (stocks.find(s => s.stockId === selectedStock)?.CurrentPrice || 0)).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
              
              {}
              {error && <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
              {success && <div className="mb-3 p-3 bg-green-100 text-green-700 rounded-lg">{success}</div>}
              
              <button 
                onClick={handleTransaction}
                className={`${
                  isBuyingDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                } text-white px-4 py-2 rounded w-full`}
                disabled={!selectedStock || isBuyingDisabled}
                title={
                  isBuyingDisabled 
                    ? `You've reached the maximum of ${MAX_TOTAL_STOCKS} total stocks. Sell some stocks first.`
                    : undefined
                }
              >
                {action === 'buy' ? 'Buy Stocks' : 'Sell Stocks'}
                {isBuyingDisabled && " (Limit Reached)"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {}
      {activeTab === 'portfolio' && (
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-2">Your Portfolio</h2>
          {userHoldings.length > 0 ? (
            <div className="bg-gray-100 p-3 rounded-lg">
              {userHoldings.map((holding) => {
                const stock = stocks.find(s => s.stockId === holding.stockId);
                if (!stock) return null;
                
                const currentValue = holding.Amount * stock.CurrentPrice;
                const avgCost = holding.moneySpent / holding.Amount;
                const profit = currentValue - holding.moneySpent;
                const profitPercentage = (profit / holding.moneySpent) * 100;
                const profitColor = profit >= 0 ? "text-green-600" : "text-red-600";
                
                return (
                  <div key={holding.stockId} className="border-b p-3">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{stock.Name || `Stock ${stock.stockId}`}</span>
                      <span>{holding.Amount} shares</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Avg. Cost:</span>
                      <span>${avgCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Current Price:</span>
                      <span>${stock.CurrentPrice}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Current Value:</span>
                      <span>${currentValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-3">
                      <span>Profit/Loss:</span>
                      <span className={profitColor}>
                        ${profit.toFixed(2)} ({profitPercentage.toFixed(2)}%)
                      </span>
                    </div>
                    
                    {}
                    <button
                      onClick={() => openSellModal(holding)}
                      className="bg-red-500 text-white px-4 py-2 rounded w-full"
                    >
                      Sell Shares
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded-lg">
              <p>You don't own any stocks yet. Start trading!</p>
            </div>
          )}
        </div>
      )}
      
      {}
      {sellModalOpen && selectedHolding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              Sell {stocks.find(s => s.stockId === selectedHolding.stockId)?.Name || `Stock ${selectedHolding.stockId}`}
            </h2>
            
            <div className="mb-3">
              <p className="mb-1">Current Price: <span className="font-bold">${stocks.find(s => s.stockId === selectedHolding.stockId)?.CurrentPrice}</span></p>
              <p className="mb-3">You own: <span className="font-bold">{selectedHolding.Amount} shares</span></p>
              
              <label htmlFor="sellQuantity" className="block mb-1">Quantity to Sell:</label>
              <input 
                type="number" 
                id="sellQuantity"
                min="1"
                max={selectedHolding.Amount}
                value={sellQuantity}
                onChange={(e) => setSellQuantity(e.target.value)}
                className="border p-2 w-full rounded mb-2"
              />
              
              <p className="mt-2">
                Total Sale Value: 
                <span className="font-bold ml-1">
                  ${(parseInt(sellQuantity || "0") * (stocks.find(s => s.stockId === selectedHolding.stockId)?.CurrentPrice || 0)).toFixed(2)}
                </span>
              </p>
            </div>
            
            {}
            {error && <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
            
            <div className="flex space-x-2">
              <button 
                onClick={closeSellModal}
                className="bg-gray-300 px-4 py-2 rounded flex-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleDirectSell}
                className="bg-red-500 text-white px-4 py-2 rounded flex-1"
                disabled={!sellQuantity || parseInt(sellQuantity) < 1 || parseInt(sellQuantity) > selectedHolding.Amount}
              >
                Sell Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StocksPage;