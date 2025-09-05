export const runtime = 'nodejs';
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

// App Routerでの正しいNextAuth.js実装
export { handler as GET, handler as POST };

// デバッグ用のログを追加
console.log('🔧 NextAuth.js route handler initialized');
