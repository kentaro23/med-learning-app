import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// 管理者メールアドレスの設定
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.toLowerCase().trim())
  .filter(Boolean);

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
            name: user.name,
            isAdmin: user.isAdmin
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
        (token as any).isAdmin = (user as any).isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).email = token.email as string;
        (session.user as any).name = token.name as string;
        (session.user as any).isAdmin = Boolean((token as any)?.isAdmin);
      }
      return session;
    }
  },
  events: {
    async createUser({ user }) {
      try {
        const email = user.email?.toLowerCase() || '';
        if (email && ADMIN_EMAILS.includes(email)) {
          await prisma.user.update({ 
            where: { id: user.id }, 
            data: { isAdmin: true } 
          });
        }
      } catch (error) {
        console.error('Failed to set admin flag:', error);
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
};

export async function getSession() {
  return await getServerSession(authOptions);
}
