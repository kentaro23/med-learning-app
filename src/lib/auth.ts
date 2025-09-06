import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { PrismaClient as DirectPrismaClient } from "@prisma/client";

// 管理者メールアドレスの設定
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map(e => e.toLowerCase().trim())
  .filter(Boolean);

async function withPrismaFallback<T>(fn: (client: any) => Promise<T>): Promise<T> {
  try {
    return await fn(prisma);
  } catch (e) {
    if (!process.env.DIRECT_URL) throw e;
    const direct = new DirectPrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });
    try {
      return await fn(direct);
    } finally {
      await direct.$disconnect().catch(() => {});
    }
  }
}

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
          if (!credentials?.email || !credentials?.password) {
            if (process.env.NODE_ENV === 'development') {
              console.log('❌ Missing credentials');
            }
            return null;
          }
          
          const email = String(credentials.email).toLowerCase().trim();
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 Authorization attempt for:', email);
          }
          
          // デモアカウントの特別処理
          if (email === 'demo@med.ai' && credentials.password === 'demo1234') {
            if (process.env.NODE_ENV === 'development') {
              console.log('🎭 Demo account authentication successful');
            }
            return {
              id: 'demo-user-123',
              email: 'demo@med.ai',
              name: 'デモユーザー'
            };
          }
          
          // テストアカウントの処理
          if (email === 'tester@example.com' && credentials.password === 'Passw0rd!') {
            if (process.env.NODE_ENV === 'development') {
              console.log('🧪 Test account authentication successful');
            }
            return {
              id: 'test-user-123',
              email: 'tester@example.com',
              name: 'Test User'
            };
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Checking database for user (with fallback):', email);
          }
          
          // 通常のユーザー認証（Pooler失敗時は直結にフォールバック）
          const user = await withPrismaFallback((client) => client.user.findUnique({ where: { email } }));
          
          if (!user) {
            if (process.env.NODE_ENV === 'development') {
              console.log('❌ User not found:', email);
            }
            return null;
          }
          
          if (!user.passwordHash) {
            if (process.env.NODE_ENV === 'development') {
              console.log('❌ User has no password hash:', email);
            }
            return null;
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔑 Comparing passwords for user:', email);
          }
          
          const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
          
          if (!ok) {
            if (process.env.NODE_ENV === 'development') {
              console.log('❌ Password mismatch for user:', email);
            }
            return null;
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Authorization successful for user:', email);
          }
          
          return { 
            id: user.id, 
            email: user.email, 
            name: user.name
          };
        } catch (error) {
          console.error('❌ Authorization error (with fallback):', error);
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
    },
    async redirect({ url, baseUrl }) {
      // 同一オリジンの絶対URLはそのまま許可
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) {
          return url;
        }
      } catch {}

      // 相対パスは baseUrl を付与
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      // それ以外は baseUrl に戻す
      return baseUrl;
    }
  },
  events: {
    async createUser({ user }) {
      try {
        const email = user.email?.toLowerCase() || '';
        if (email && ADMIN_EMAILS.includes(email)) {
          // isAdminフィールドがスキーマに存在しないため、この処理をコメントアウト
          // await prisma.user.update({ 
          //   where: { id: user.id }, 
          //   data: { isAdmin: true } 
          // });
          console.log('Admin user created:', email);
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
