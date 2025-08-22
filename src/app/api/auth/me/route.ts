import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // デモ用：セッションクッキーが存在する場合、テストユーザーを返す
    // 実際の実装では、セッショントークンを検証してユーザーIDを取得
    console.log('🔍 Looking for demo user...');
    const user = await prisma.user.findFirst({
      where: { email: 'demo@med.ai' },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      console.log('❌ Demo user not found');
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    console.log('✅ User found:', user);
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });

  } catch (error) {
    console.error('❌ Get user info error:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
