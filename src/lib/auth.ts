import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/server/email";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = String(credentials.email).toLowerCase().trim();
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user || !user.passwordHash) return null;
        
        const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
        if (!ok) return null;
        
        return { id: user.id, email: user.email, name: user.name ?? null };
      },
    }),
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      // Persist user id on token
      if (user) {
        (token as any).uid = (user as any).id;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user && (token as any)?.uid) {
        (session.user as any).id = (token as any).uid as string;
      }
      return session;
    }
  },
  events: {
    async createUser({ user }: { user: any }) {
      try {
        await sendWelcomeEmail({ email: user.email!, name: user.name || undefined });
      } catch (error) {
        console.error('Welcome email failed:', error);
      }
    }
  }
};

export async function getSession() {
  return await getServerSession(authOptions);
}
