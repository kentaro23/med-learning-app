import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 /api/auth/me called');
    
    // セッションクッキーからユーザーIDを取得（簡易版）
    const cookies = request.headers.get('cookie') || '';
    console.log('🍪 Cookies received:', cookies);
    
    const sessionCookie = cookies.split(';').find(cookie => 
      cookie.trim().startsWith('next-auth.session-token=')
    );

    console.log('🔑 Session cookie found:', !!sessionCookie);

    if (!sessionCookie) {
      console.log('❌ No session cookie found');
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      );
    }

    // セッションクッキーが存在する場合、ユーザー情報を返す
    console.log('✅ Session cookie found, returning user info');
    
    // セッションクッキーの内容に基づいてユーザー情報を返す
    if (sessionCookie.includes('demo-session-token')) {
      return NextResponse.json({
        user: {
          id: 'demo-user-123',
          name: 'デモユーザー',
          email: 'demo@med.ai',
        }
      });
    } else if (sessionCookie.includes('user-session-')) {
      return NextResponse.json({
        user: {
          id: 'new-user-123',
          name: '新規ユーザー',
          email: 'user@example.com',
        }
      });
    } else {
      // デフォルトユーザー
      return NextResponse.json({
        user: {
          id: 'default-user',
          name: 'ユーザー',
          email: 'user@example.com',
        }
      });
    }

  } catch (error) {
    console.error('❌ Get user info error:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
