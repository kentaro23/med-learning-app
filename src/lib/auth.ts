import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/server/email";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
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
          console.log('🔐 Credentials received:', { 
            email: credentials?.email, 
            hasPassword: !!credentials?.password 
          });
          
          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Missing credentials');
            return null;
          }
          
          const email = String(credentials.email).toLowerCase().trim();
          console.log('🔍 Looking for user with email:', email);
          
          // デモアカウントの特別処理
          if (email === 'demo@med.ai' && credentials.password === 'demo1234') {
            console.log('🎭 Demo account authentication successful');
            const demoUser = {
              id: 'demo-user-123',
              email: 'demo@med.ai',
              name: 'デモユーザー'
            };
            console.log('🎭 Demo user object:', demoUser);
            return demoUser;
          }
          
          console.log('🔍 Not a demo account, checking database...');
          
          // 通常のユーザー認証
          const user = await prisma.user.findUnique({ where: { email } });
          
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
          return { id: user.id, email: user.email, name: user.name ?? null };
        } catch (error) {
          console.error('❌ Authorization error:', error);
          console.error('❌ Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
          return null;
        }
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
