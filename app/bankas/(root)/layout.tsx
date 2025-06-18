'use client';
import React, { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import { usePathname } from "next/navigation";

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [isLoginPage, setIsLoginPage] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    setIsLoginPage(pathname === "/bankas");
  }, [pathname]);
  
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow p-2 md:p-4 w-full max-w-screen-lg mx-auto">
          {children}
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isLoginPage && <Navbar />}
      <main className="flex-grow p-2 md:p-4 w-full max-w-screen-lg mx-auto">
        {children}
      </main>
    </div>
  );
};

export default RootLayout;