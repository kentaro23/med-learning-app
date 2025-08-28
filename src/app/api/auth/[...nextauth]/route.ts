import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

// エラーハンドリングを追加
export async function GET(request: Request) {
  try {
    return await handler(request);
  } catch (error) {
    console.error('NextAuth GET error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return await handler(request);
  } catch (error) {
    console.error('NextAuth POST error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
