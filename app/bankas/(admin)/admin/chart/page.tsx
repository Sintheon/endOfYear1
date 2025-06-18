'use client'
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Stock = {
  stockId: number;
  CurrentPrice: number;
  LastPrice: number;
  Name?: string;
  stockName?: string;
  color?: string;
};

type PriceHistoryPoint = {
  timestamp: string;
  date: string;
  time: string;
  prices: Record<string, number>;
  priceArray: number[];
};

type RichestUser = {
  userId: number;
  playerName: string;
  balance: number;
};

export default function StockCharts() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLimit, setHistoryLimit] = useState(30);
  const [richestUser, setRichestUser] = useState<RichestUser | null>(null);
  
  const [viewMode, setViewMode] = useState<'recent' | 'all'>('recent');
  const [recentPointsCount, setRecentPointsCount] = useState(3);
  
  const stockColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];
  const processChartData = (history: any[], stocks: Stock[]) => {
    if (!history || history.length === 0) {
      return [];
    }
    
    const sortedHistory = [...history].reverse();
    
    const dataToProcess = viewMode === 'recent' && recentPointsCount > 0 && recentPointsCount < sortedHistory.length
      ? sortedHistory.slice(-recentPointsCount)
      : sortedHistory;
    
    return dataToProcess.map(point => {
      const dataPoint: any = {
        date: point.date || '',
        time: point.time || '',
        timestamp: point.timestamp || '',
      };
      
      stocks.forEach((stock, index) => {
        if (point.priceArray && point.priceArray[index] !== undefined) {
          dataPoint[`stock${stock.stockId}`] = point.priceArray[index];
        }
      });
      
      return dataPoint;
    });
  };
  
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }
      
      const stocksResponse = await fetch("/api/stocks");
      if (!stocksResponse.ok) throw new Error("Failed to fetch stocks");
      
      const stocksData = await stocksResponse.json();
      
      const enhancedStocks = stocksData.stocks.map((stock: Stock, index: number) => ({
        ...stock,
        stockName: stock.Name || `Stock ${stock.stockId}`,
        color: stockColors[index % stockColors.length]
      }));
      
      setStocks(enhancedStocks);
      const historyResponse = await fetch(`/api/price-history?limit=${historyLimit}`);
      if (!historyResponse.ok) throw new Error("Failed to fetch price history");
      
      const historyData = await historyResponse.json();
      
      if (historyData && historyData.history) {
        setPriceHistory(historyData.history);
        const formattedChartData = processChartData(historyData.history, enhancedStocks);
        setChartData(formattedChartData);
      } else {
        throw new Error("Invalid history data format");
      }

      const statsResponse = await fetch('/api/system-stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.richestUser) {
          setRichestUser(statsData.richestUser);
        }
      }
      
      setError(null);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to load stock data. Please try again.");
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [historyLimit, viewMode, recentPointsCount]);
  
  useEffect(() => {
    if (priceHistory.length > 0 && stocks.length > 0) {
      const formattedChartData = processChartData(priceHistory, stocks);
      setChartData(formattedChartData);
    }
  }, [viewMode, recentPointsCount, priceHistory, stocks]);
  
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/bankas");
      return;
    }
    
    fetchData();
    
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [session, status, router, fetchData]);
  
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'recent' ? 'all' : 'recent');
  };
  
  const handleRecentPointsCountChange = (count: number) => {
    setRecentPointsCount(count);
    setViewMode('recent');
  };
  
  const handleLimitChange = (newLimit: number) => {
    setHistoryLimit(newLimit);
    fetchData();
  };
  const CustomizedDot = (props: any) => {
    const { cx, cy, value, dataKey, stroke } = props;
    if (props.index === chartData.length - 1) {
      return (
        <circle cx={cx} cy={cy} r={4} fill={stroke} stroke="#fff" strokeWidth={2} />
      );
    }
    return <circle cx={cx} cy={cy} r={2} fill={stroke} />;
  };
  
  if (isInitialLoading) {
    return <div className="flex items-center justify-center h-screen">Loading chart data...</div>;
  }
  
  if (error && chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 p-4 rounded-lg text-red-700 mb-4">{error}</div>
        <button 
          onClick={() => fetchData()}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-4 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Stock Price History</h1>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center">
            <button
              onClick={toggleViewMode}
              className={`px-3 py-1 rounded-lg ${
                viewMode === 'recent' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {viewMode === 'recent' ? `Recent (${recentPointsCount}) Points` : 'All Points'}
            </button>
          </div>
          
          {}
          {viewMode === 'recent' && (
            <div className="flex items-center space-x-2">
              <label className="text-sm">Points:</label>
              <select
                value={recentPointsCount}
                onChange={(e) => handleRecentPointsCountChange(Number(e.target.value))}
                className="border p-1 rounded text-sm"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
          )}
          
          {}
          <div className="flex items-center space-x-2">
            <label htmlFor="historyLimit" className="text-sm">History Max:</label>
            <select 
              id="historyLimit" 
              value={historyLimit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="border p-1 rounded text-sm"
              disabled={isRefreshing}
            >
              <option value={10}>10</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
              <option value={100}>100</option>
              <option value={0}>All</option>
            </select>
          </div>
          
          {isRefreshing && (
            <span className="text-sm text-blue-500">Refreshing data...</span>
          )}
        </div>
      </div>
      
      {}
      {richestUser && (
        <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 rounded-lg shadow mb-4">
          <h2 className="text-lg font-bold text-yellow-800 mb-2">Current richest User</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-xl">{richestUser.playerName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-yellow-800">Balance</p>
              <p className="text-2xl font-bold text-yellow-900">${richestUser.balance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
      
      {}
      <div className="bg-white p-4 rounded-lg shadow flex-grow relative">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
              />
              <YAxis 
                label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }} 
                domain={['auto', 'auto']}
              />
              <Tooltip 
                formatter={(value, name, props) => {
                  const stockId = (name as string).replace('stock', '');
                  const stock = stocks.find(s => s.stockId === Number(stockId));
                  return [`$${value}`, stock?.stockName || name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              {stocks.map((stock) => (
                <Line
                  key={stock.stockId}
                  type="linear"
                  dataKey={`stock${stock.stockId}`}
                  name={stock.stockName || stock.Name || `Stock ${stock.stockId}`}
                  stroke={stock.color}
                  dot={<CustomizedDot />}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>No price history data available.</p>
          </div>
        )}
        
        {}
        {isRefreshing && (
          <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
            Refreshing...
          </div>
        )}
        
        {}
        {error && chartData.length > 0 && (
          <div className="absolute top-2 left-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
            Error refreshing: {error}
          </div>
        )}
      </div>
      
      {}
      <div className="flex flex-wrap gap-2 mt-4 justify-end">
        {stocks.map((stock) => (
          <div 
            key={stock.stockId}
            className="flex items-center bg-white rounded-full shadow p-1 px-3 border"
            style={{ borderColor: stock.color }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2" style={{ backgroundColor: stock.color }}>
              <span className="text-white text-xs font-bold">{stock.stockId}</span>
            </div>
            <div>
              <div className="text-xs font-bold">{stock.stockName || stock.Name || `Stock ${stock.stockId}`}</div>
              <div className="text-xs">${stock.CurrentPrice}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}