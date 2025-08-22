import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkUsageLimit } from '@/lib/usage-limits';

const requestSchema = z.object({
  feature: z.enum(['aiQuestions', 'cardSets', 'pdfs']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feature } = requestSchema.parse(body);

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
    
    const usageCheck = await checkUsageLimit(userId, feature);
    
    if (!usageCheck.canUse) {
      return NextResponse.json(
        { 
          error: '使用制限に達しました',
          details: usageCheck.message,
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
          remaining: usageCheck.remaining
        }, 
        { status: 429 }
      );
    }

    return NextResponse.json({
      canUse: true,
      currentUsage: usageCheck.currentUsage,
      limit: usageCheck.limit,
      remaining: usageCheck.remaining,
      message: usageCheck.message
    });
  } catch (error) {
    console.error('Usage check error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '無効なリクエストデータです', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '使用制限の確認中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
