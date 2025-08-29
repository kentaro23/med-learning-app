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
            console.log('🔍 Checking database for user:', email);
          }
          
          // 通常のユーザー認証
          const user = await prisma.user.findUnique({ 
            where: { email }
          });
          
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
            name: user.name ?? undefined
          };
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Authorization error:', error);
          }
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
        // store uid for session mapping
        (token as any).uid = (user as any).id;
        token.id = (user as any).id;
        token.email = (user as any).email;
        token.name = (user as any).name;
        (token as any).isAdmin = (user as any).isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = ((token as any).uid as string) ?? (token.id as string);
        (session.user as any).email = token.email as string;
        (session.user as any).name = token.name as string;
        (session.user as any).isAdmin = Boolean((token as any)?.isAdmin);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // ログイン成功後のリダイレクト処理
      console.log('🔄 Redirect callback:', { url, baseUrl });
      
      // ログイン成功後のデフォルトリダイレクト
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }
      
      // サインインページからのリダイレクトは、ログイン成功時のみダッシュボードに
      // 既に認証済みの場合は、元々アクセスしようとしていたページにリダイレクト
      if (url.includes('/auth/signin')) {
        // サインインページからのリダイレクトは、ログイン成功時のみ
        return `${baseUrl}/dashboard`;
      }
      
      // 相対パスの場合はbaseUrlと結合
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // 同じオリジンの場合はそのまま
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // デフォルトはダッシュボード
      return `${baseUrl}/dashboard`;
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
