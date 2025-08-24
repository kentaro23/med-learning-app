import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user) {
          return null;
        }

        // パスワード検証（実際の実装ではbcryptを使用）
        if (credentials.password === "password") {
          return user;
        }

        return null;
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist user id on token
      if (user) token.uid = (user as any).id;
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.uid) {
        (session.user as any).id = token.uid as string;
      }
      return session;
    }
  }
};

export async function getSession() {
  return await getServerSession(authOptions);
}
