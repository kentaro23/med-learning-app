import { NextRequest, NextResponse } from 'next/server';
import { getUserUsageSummary } from '@/lib/usage-limits';

export async function GET(request: NextRequest) {
  try {
    // セッションクッキーからユーザー情報を取得
    const sessionCookie = request.cookies.get('next-auth.session-token');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // デモユーザーの場合は特別処理
    let userId = 'demo-user-id';
    
    // セッションクッキーがデモセッションの場合は、実際のデモユーザーIDを使用
    if (sessionCookie.value === 'demo-session-token') {
      // データベースからデモユーザーを検索
      const { prisma } = await import('@/lib/prisma');
      
      try {
        const demoUser = await prisma.user.findUnique({
          where: { email: 'demo@med.ai' },
          select: { id: true }
        });
        
        if (demoUser) {
          userId = demoUser.id;
        }
      } catch (error) {
        console.error('Demo user lookup error:', error);
      }
    }
    
    const usageSummary = await getUserUsageSummary(userId);
    
    if (!usageSummary) {
      return NextResponse.json(
        { error: '使用状況の取得に失敗しました' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      usage: usageSummary,
      message: '使用状況を取得しました'
    });
  } catch (error) {
    console.error('Usage summary error:', error);
    return NextResponse.json(
      { error: '使用状況の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
