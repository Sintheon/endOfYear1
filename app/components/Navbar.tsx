'use client';
import { useSession } from "next-auth/react";
import Link from 'next/link';

const Navbar = () => {
    const { data: session } = useSession();
    
    return (
        <header className="w-full bg-blue-600 p-4 flex justify-between items-center">
            <Link href="/bankas/home" className="text-white text-xl sm:text-2xl md:text-3xl no-underline">
                Licodisėjos bankas
            </Link>
            
            {session && (
                <Link href={`/bankas/users/${session.user?.id}`}>
                    <img 
                        id="pfp" 
                        src="/profile.png" 
                        alt="Profile"
                        className="w-10 h-10 sm:w-12 sm:h-12" 
                    />
                </Link>
            )}
        </header>
    );
}

export default Navbar;