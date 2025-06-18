import "next-auth";
import { UserRole } from "@/app/api/auth/[...nextauth]/route";

declare module "next-auth" {
  interface User {
    id: string;
    playerName: string;
    role: UserRole;
    balance?: number;
  }

  interface Session {
    user: {
      id: string;
      playerName: string;
      role: UserRole;
      balance?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    playerName: string;
    role: UserRole;
    balance?: number;
  }
}