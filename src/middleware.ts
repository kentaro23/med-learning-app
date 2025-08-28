import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 保護されたルート（認証が必要）
const protectedRoutes = ['/', '/dashboard', '/ai-questions', '/card-sets', '/pdf-cloze'];

// パブリックルート（認証不要）
const publicRoutes = ['/intro', '/auth/signin', '/auth/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 本番環境とローカル環境で異なるクッキー名を使用
  const sessionCookie = request.cookies.get('next-auth.session-token') || 
                       request.cookies.get('__Secure-next-auth.session-token');
  const isAuthenticated = !!sessionCookie;

  console.log('🔒 Middleware:', { 
    pathname, 
    isAuthenticated, 
    hasSessionCookie: !!sessionCookie,
    cookieValue: sessionCookie?.value ? 'exists' : 'none'
  });

  // 保護されたルートにアクセスしようとしている場合
  if (protectedRoutes.includes(pathname)) {
    if (!isAuthenticated) {
      console.log('❌ Unauthorized access to protected route, redirecting to intro');
      return NextResponse.redirect(new URL('/intro', request.url));
    }
    console.log('✅ Authorized access to protected route');
    return NextResponse.next();
  }

  // パブリックルートの場合
  if (publicRoutes.includes(pathname)) {
    // 認証済みユーザーが紹介ページにアクセスした場合、ダッシュボードにリダイレクト
    if (pathname === '/intro' && isAuthenticated) {
      console.log('🔄 Authenticated user accessing intro, redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    console.log('✅ Access to public route');
    return NextResponse.next();
  }

  // その他のルートは許可
  console.log('✅ Access to other route');
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
