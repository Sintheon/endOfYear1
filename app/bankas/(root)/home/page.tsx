'use client'
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/bankas");
      return;
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

  if (status === "loading") {
    return <div className="p-4">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-2">
          Welcome, {session?.user?.playerName}
        </h1>
        {balance !== null && (
          <div className="bg-gray-100 p-4 rounded-lg inline-block">
            <p className="font-medium">Balance: <span className="font-bold">${balance.toLocaleString()}</span></p>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        <Link href="/bankas/transactions" className="bg-blue-600 text-white p-4 rounded-lg text-center font-medium">
          SEND MONEY
        </Link>
        
        <Link href="/bankas/stocks" className="bg-green-600 text-white p-4 rounded-lg text-center font-medium">
          TRADE STOCKS
        </Link>
        
        {session.user?.role === 'admin' && (
          <Link href="/bankas/admin" className="bg-purple-600 text-white p-4 rounded-lg text-center font-medium">
            ADMIN DASHBOARD
          </Link>
        )}
      </div>
    </div>
  );
}