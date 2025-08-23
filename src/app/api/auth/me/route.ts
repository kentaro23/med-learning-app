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

    // セッションクッキーが存在しない場合でも、デフォルトユーザーを返す
    if (!sessionCookie) {
      console.log('⚠️ No session cookie found, returning default user');
      return NextResponse.json({
        user: {
          id: 'default-user',
          name: 'ゲストユーザー',
          email: 'guest@example.com',
        }
      });
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
    // エラーが発生した場合も、デフォルトユーザーを返す
    return NextResponse.json({
      user: {
        id: 'error-user',
        name: 'エラーユーザー',
        email: 'error@example.com',
      }
    });
  }
}
