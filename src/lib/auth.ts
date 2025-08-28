import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/server/email";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('🔐 Authorization attempt for:', credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Missing credentials');
            return null;
          }
          
          const email = String(credentials.email).toLowerCase().trim();
          console.log('🔍 Processing email:', email);
          
          // デモアカウントの特別処理
          if (email === 'demo@med.ai' && credentials.password === 'demo1234') {
            console.log('🎭 Demo account authentication successful');
            return {
              id: 'demo-user-123',
              email: 'demo@med.ai',
              name: 'デモユーザー'
            };
          }
          
          console.log('🔍 Checking database for user:', email);
          
          // 通常のユーザー認証
          const user = await prisma.user.findUnique({ 
            where: { email }
          });
          
          if (!user) {
            console.log('❌ User not found:', email);
            return null;
          }
          
          if (!user.passwordHash) {
            console.log('❌ User has no password hash:', email);
            return null;
          }
          
          console.log('🔑 Comparing passwords for user:', email);
          const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
          
          if (!ok) {
            console.log('❌ Password mismatch for user:', email);
            return null;
          }
          
          console.log('✅ Authorization successful for user:', email);
          return { 
            id: user.id, 
            email: user.email, 
            name: user.name 
          };
        } catch (error) {
          console.error('❌ Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).email = token.email as string;
        (session.user as any).name = token.name as string;
      }
      return session;
    }
  },
  debug: process.env.NODE_ENV === 'development',
};

export async function getSession() {
  return await getServerSession(authOptions);
}
