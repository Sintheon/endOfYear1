'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { use } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: urlUserId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedUserId, setDisplayedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/bankas");
      return;
    }

    if (urlUserId !== session.user?.id && session.user?.role !== 'admin') {
      router.replace(`/bankas/users/${session.user?.id}`);
      return;
    }

    const idToUse = urlUserId;
    setDisplayedUserId(idToUse);

    const fetchBalance = async () => {
      try {
        const response = await fetch(`/api/balance?userId=${idToUse}`);
        if (response.ok) {
          const data = await response.json();
          setBalance(data.balance);
        }
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [session, status, urlUserId, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/bankas' });
  };

  if (isLoading || status === "loading" || !displayedUserId) {
    return <p className="p-4">Loading...</p>;
  }

  const isAdmin = session?.user?.role === 'admin';
  const isOwnProfile = displayedUserId === session?.user?.id;
  const viewingOtherProfile = !isOwnProfile && isAdmin;

  const displayName = isOwnProfile ? session?.user?.playerName : `User ${displayedUserId}`;

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-2">
          {viewingOtherProfile ? `User Profile (ID: ${displayedUserId})` : 'Your Profile'}
        </h1>
        <div className="space-y-2">
          <p><span className="font-medium">Name:</span> {displayName}</p>
          <p><span className="font-medium">User ID:</span> {displayedUserId}</p>
          {isOwnProfile && (
            <p><span className="font-medium">Role:</span> {session?.user?.role}</p>
          )}
          <p><span className="font-medium">Balance:</span> ${balance?.toLocaleString()}</p>
        </div>
      </div>

      {viewingOtherProfile ? (
        <div className="grid gap-4">
          <Link href="/bankas/admin" className="bg-gray-600 text-white p-4 rounded-lg text-center font-medium">
            BACK TO ADMIN DASHBOARD
          </Link>
          
          <Link href={`/bankas/transactions`} className="bg-green-600 text-white p-4 rounded-lg text-center font-medium">
            SEND MONEY TO THIS USER
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          <Link href="/bankas/home" className="bg-blue-600 text-white p-4 rounded-lg text-center font-medium">
            HOME
          </Link>
          
          <Link href="/bankas/transactions" className="bg-green-600 text-white p-4 rounded-lg text-center font-medium">
            SEND MONEY
          </Link>
          
          <Link href="/bankas/stocks" className="bg-purple-600 text-white p-4 rounded-lg text-center font-medium">
            TRADE STOCKS
          </Link>
          
          {isAdmin && (
            <Link href="/bankas/admin" className="bg-gray-800 text-white p-4 rounded-lg text-center font-medium">
              ADMIN DASHBOARD
            </Link>
          )}
          
          <button 
            onClick={handleSignOut}
            className="bg-red-600 text-white p-4 rounded-lg text-center font-medium"
          >
            SIGN OUT
          </button>
        </div>
      )}
    </div>
  );
}