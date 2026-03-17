'use client'
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  userId: number;
  playerName: string;
  balance: number;
};

type SystemStats = {
  totalMoneyIssued: number;
  totalUserBalance: number;
  netBalance: number;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stocks, setStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalMoneyIssued: 0,
    totalUserBalance: 0,
    netBalance: 0
  });
  
  const [targetUserId, setTargetUserId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferSuccess, setTransferSuccess] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [priceUpdateError, setPriceUpdateError] = useState("");
  const [priceUpdateSuccess, setPriceUpdateSuccess] = useState("");
  
  const [isRecordingHistory, setIsRecordingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historySuccess, setHistorySuccess] = useState("");
  
  useEffect(() => {
    if (status === "loading") return;

    setIsLoading(false);
    
    if (!session) {
      router.push("/bankas");
    } else if (session.user?.role !== 'admin') {
      router.push(`/bankas/users/${session.user?.id}`);
    } else {
      fetchData();
    }
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const stocksResponse = await fetch("/api/stocks");
      if (stocksResponse.ok) {
        const data = await stocksResponse.json();
        setStocks(data.stocks);
      }
      
      const statsResponse = await fetch("/api/system-stats");
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setSystemStats(data.systemStats);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const handleTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTransferError("");
    setTransferSuccess("");
    setIsTransferring(true);

    try {
      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: session?.user?.id,
          targetId: targetUserId,
          amount: Number(transferAmount)
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setTransferSuccess(result.message);
        setTargetUserId("");
        setTransferAmount("");
        fetchData();
      } else {
        setTransferError(result.message);
      }
    } catch (error) {
      setTransferError("An error occurred while processing the transfer.");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleUpdateStockPrices = async () => {
    setPriceUpdateError("");
    setPriceUpdateSuccess("");
    setIsUpdatingPrices(true);
    
    try {
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Send an empty object to ensure body is parsed correctly
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setPriceUpdateSuccess('Stock prices updated successfully');
        fetchData(); // Refresh stock data
      } else {
        setPriceUpdateError(result.message || 'Failed to update stock prices');
      }
    } catch (error) {
      console.error('Error updating stock prices:', error);
      setPriceUpdateError('Error updating stock prices');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const handleRecordPriceHistory = async () => {
    setHistoryError("");
    setHistorySuccess("");
    setIsRecordingHistory(true);
    
    try {
      const response = await fetch('/api/price-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Send an empty object
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setHistorySuccess('Price history recorded successfully');
      } else {
        setHistoryError(result.message || 'Failed to record price history');
      }
    } catch (error) {
      console.error('Error recording price history:', error);
      setHistoryError('Error recording price history');
    } finally {
      setIsRecordingHistory(false);
    }
  };

  const handleResetMarket = async () => {
    if (!confirm("Are you sure you want to reset the market? This will remove all user holdings, reset balances to 0, and clear most price history. Stock prices will remain unchanged. This action cannot be undone.")) {
      return;
    }
    
    setResetError("");
    setResetSuccess("");
    setIsResetting(true);
    
    try {
      const response = await fetch('/api/reset-market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setResetSuccess(result.message);
        fetchData();
      } else {
        setResetError(result.message || 'Failed to reset market');
      }
    } catch (error) {
      console.error('Error resetting market:', error);
      setResetError('An error occurred while resetting the market');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading || status === "loading") {
    return <p className="p-4">Loading...</p>;
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="font-medium">Admin ID: <span className="font-bold">{session.user?.id}</span></p>
          <p className="font-medium">Name: <span className="font-bold">{session.user?.playerName}</span></p>
          <p className="font-medium">Role: <span className="font-bold">{session.user?.role}</span></p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="font-medium">System Balance: <span className="font-bold">${session.user?.balance?.toLocaleString()}</span></p>
          <p className="font-medium">Active Stocks: <span className="font-bold">{stocks.length}</span></p>
          <p className="font-medium">Current Date: <span className="font-bold">{new Date().toLocaleDateString()}</span></p>
        </div>
      </div>
      
      {/* Success/Error messages for all actions */}
      {resetSuccess && (
        <div className="bg-green-100 p-4 rounded-lg border border-green-300 mb-4">
          <p className="text-green-700 font-medium">{resetSuccess}</p>
        </div>
      )}
      
      {resetError && (
        <div className="bg-red-100 p-4 rounded-lg border border-red-300 mb-4">
          <p className="text-red-700 font-medium">{resetError}</p>
        </div>
      )}
      
      {priceUpdateSuccess && (
        <div className="bg-green-100 p-4 rounded-lg border border-green-300 mb-4">
          <p className="text-green-700 font-medium">{priceUpdateSuccess}</p>
        </div>
      )}
      
      {priceUpdateError && (
        <div className="bg-red-100 p-4 rounded-lg border border-red-300 mb-4">
          <p className="text-red-700 font-medium">{priceUpdateError}</p>
        </div>
      )}
      
      {historySuccess && (
        <div className="bg-green-100 p-4 rounded-lg border border-green-300 mb-4">
          <p className="text-green-700 font-medium">{historySuccess}</p>
        </div>
      )}
      
      {historyError && (
        <div className="bg-red-100 p-4 rounded-lg border border-red-300 mb-4">
          <p className="text-red-700 font-medium">{historyError}</p>
        </div>
      )}
      
      {/* System Money Tracking */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">System Money Tracking</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-blue-100 rounded">
            <p className="text-sm text-blue-800 font-medium">Total User Balance</p>
            <p className="text-2xl font-bold text-blue-900">${systemStats.totalUserBalance.toLocaleString()}</p>
          </div>
          
          <div className="p-3 bg-purple-100 rounded">
            <p className="text-sm text-purple-800 font-medium">Total Money Issued</p>
            <p className="text-2xl font-bold text-purple-900">${systemStats.totalMoneyIssued.toLocaleString()}</p>
          </div>
          
          <div className={`p-3 rounded ${systemStats.netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className={`text-sm font-medium ${systemStats.netBalance >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              Net Balance (+ users gain, - users lose)
            </p>
            <p className={`text-2xl font-bold ${systemStats.netBalance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              ${systemStats.netBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Add/Remove User Balance */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Add/Remove User Balance</h2>
        
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label htmlFor="targetUserId" className="block mb-1">Target User ID:</label>
            <input
              type="text"
              id="targetUserId"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label htmlFor="transferAmount" className="block mb-1">Amount (positive to add, negative to remove):</label>
            <input
              type="number"
              id="transferAmount"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full p-2 border rounded"
              step="1"
              required
            />
          </div>
          
          {transferError && <p className="text-red-600 p-2 bg-red-50 rounded">{transferError}</p>}
          {transferSuccess && <p className="text-green-600 p-2 bg-green-50 rounded">{transferSuccess}</p>}
          
          <button 
            type="submit" 
            className="bg-green-600 text-white p-3 rounded font-medium w-full"
            disabled={isTransferring}
          >
            {isTransferring ? "Processing..." : "Transfer Money"}
          </button>
        </form>
      </div>
      
      {/* Admin Actions */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Admin Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/bankas/admin/chart" className="bg-blue-600 text-white p-3 rounded font-medium text-center">
            View Stock Charts
          </Link>
          
          <button 
            className="bg-purple-600 text-white p-3 rounded font-medium disabled:bg-purple-400"
            onClick={handleUpdateStockPrices}
            disabled={isUpdatingPrices}
          >
            {isUpdatingPrices ? "Updating..." : "Update Stock Prices"}
          </button>
          
          <button 
            className="bg-green-600 text-white p-3 rounded font-medium disabled:bg-green-400"
            onClick={handleRecordPriceHistory}
            disabled={isRecordingHistory}
          >
            {isRecordingHistory ? "Recording..." : "Record Price History"}
          </button>
          
          <button 
            className="bg-red-600 text-white p-3 rounded font-medium disabled:bg-red-400"
            onClick={handleResetMarket}
            disabled={isResetting}
          >
            {isResetting ? "Resetting..." : "Reset Market"}
          </button>
        </div>
      </div>
    </div>
  );
}