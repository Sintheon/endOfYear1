'use client'
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const TransferForm = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/bankas");
    }

    const fetchBalance = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/balance?userId=${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            setBalance(data.balance);
          }
        } catch (error) {
          console.error("Failed to fetch balance:", error);
        }
      }
    };

    fetchBalance();
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const parsedAmount = Number(amount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Please enter a valid positive amount");
        setLoading(false);
        return;
      }

      if (!targetId || targetId.trim() === "") {
        setError("Please enter a valid target ID");
        setLoading(false);
        return;
      }

      if (balance !== null && parsedAmount > balance && session?.user?.id !== "1") {
        setError("Insufficient balance for this transfer");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: session?.user?.id,
          targetId,
          amount: parsedAmount
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setSuccess(result.message);
        setAmount("");
        setTargetId("");
        
        if (session?.user?.id) {
          const balanceResponse = await fetch(`/api/balance?userId=${session.user.id}`);
          if (balanceResponse.ok) {
            const data = await balanceResponse.json();
            setBalance(data.balance);
          }
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("An error occurred while processing the transfer.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <p className="p-4">Loading...</p>;
  }

  if (!session) {
    return <p className="p-4">You must be logged in to make a transfer.</p>;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Transfer Funds</h1>
      
      {balance !== null && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p className="font-medium">Your Current Balance: <span className="font-bold">${balance.toLocaleString()}</span></p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="targetId" className="block mb-1">Send money to(ID):</label>
          <input
            type="text"
            id="targetId"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full p-3 border rounded text-base"
            required
          />
        </div>
        <div>
          <label htmlFor="amount" className="block mb-1">Amount:</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 border rounded text-base"
            min="1"
            step="1"
            required
          />
        </div>
        
        {error && <p className="text-red-600 font-medium p-2 bg-red-50 rounded">{error}</p>}
        {success && <p className="text-green-600 font-medium p-2 bg-green-50 rounded">{success}</p>}
        
        <button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-medium text-base"
          disabled={loading}
        >
          {loading ? "Processing..." : "Transfer"}
        </button>
      </form>
    </div>
  );
};

export default TransferForm;