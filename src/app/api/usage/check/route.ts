import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feature } = body;

    // NextAuth.jsのセッションを取得
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // デモユーザーの場合は制限なし
    if (session.user.email === 'demo@med.ai') {
      return NextResponse.json({
        success: true,
        message: 'デモユーザーは制限なしで利用できます',
        canUse: true,
        remainingUses: -1, // 制限なし
        dailyLimit: -1,
      });
    }

    // 無料プランユーザーの場合（デモ以外のユーザー）
    // 現在の日付を取得
    const today = new Date().toDateString();
    
    // 実際の実装ではデータベースから使用回数を取得
    // 現在はモックデータで1日5回まで許可
    const mockUsage = {
      date: today,
      feature: feature,
      count: 0, // 実際の実装ではデータベースから取得
      dailyLimit: 5,
    };

    const remainingUses = mockUsage.dailyLimit - mockUsage.count;
    const canUse = remainingUses > 0;

    if (canUse) {
      return NextResponse.json({
        success: true,
        message: '問題演習を開始できます',
        canUse: true,
        remainingUses: remainingUses,
        dailyLimit: mockUsage.dailyLimit,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '本日の使用制限に達しました。明日またお試しください。',
        canUse: false,
        remainingUses: 0,
        dailyLimit: mockUsage.dailyLimit,
        details: '無料プランでは1日5回まで問題演習ができます。',
      }, { status: 429 });
    }

  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json(
      { error: '使用制限の確認に失敗しました' },
      { status: 500 }
    );
  }
}
