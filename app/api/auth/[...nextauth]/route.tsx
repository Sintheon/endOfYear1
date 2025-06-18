import NextAuth, { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { signIn, money } from "@/src/db/schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const db = drizzle(client);

export type UserRole = "admin" | "user";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        userId: { label: "User ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.userId || !credentials?.password) {
          throw new Error("Please enter both User ID and password");
        }

        try {
          const user = await db.select().from(signIn).where(eq(signIn.userId, Number(credentials.userId))).limit(1);

          if (user.length === 0) {
            throw new Error("No user found with this User ID");
          }

          if (!user[0].password) {
            throw new Error("Invalid user data: missing password");
          }

          const isValid = await bcrypt.compare(credentials.password, user[0].password);
          if (!isValid) {
            throw new Error("Invalid password");
          }

          const userBalance = await db.select().from(money).where(eq(money.userId, user[0].userId)).limit(1);
          
          const role: UserRole = user[0].userId === 1 ? "admin" : "user";

          return {
            id: user[0].userId.toString(),
            playerName: user[0].playerName,
            role: role,
            balance: userBalance.length > 0 ? userBalance[0].balance : 0,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  pages: {
    signIn: "/bankas",
    error: "/bankas?error=true",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.playerName = user.playerName;
        token.role = user.role;
        token.balance = user.balance;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          playerName: token.playerName as string,
          role: token.role as UserRole,
          balance: token.balance as number,
        };
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };