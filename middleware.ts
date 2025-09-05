import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATH_PREFIXES = [
  '/auth',        // signin/signup は常に表示
  '/api/auth',    // NextAuth のAPI
  '/_next',
  '/favicon',
  '/images',
  '/public',
  '/assets',
  '/robots.txt',
  '/sitemap.xml',
];

const PROTECTED_PATH_PREFIXES = [
  '/dashboard',
  '/profile',
  '/card-sets',
  '/messages',
  '/pdf-cloze',
  '/api/card-sets',
  '/api/usage',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 静的ファイルは常に許可
  if (pathname.startsWith('/_next') || pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)) {
    return NextResponse.next();
  }

  // 認証関連は完全スキップ（フォーム/NextAuth API は常に通す）
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // トークン取得に失敗しても未認証扱いで処理継続
  let token: any = null;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    token = null;
  }

  // 未認証で保護ページに来たら /auth/signin へ（callbackUrl付き）
  if (!token && isProtected) {
    const url = new URL('/auth/signin', req.url);
    url.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(url);
  }

  // それ以外は通す
  return NextResponse.next();
}

export const config = {
  // 画像/静的を除き全体に適用
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)'],
};
