import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feature } = body;

    // セッションクッキーからユーザー情報を取得
    const sessionCookie = request.cookies.get('next-auth.session-token');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // デモユーザーの場合は制限なし
    if (sessionCookie.value === 'demo-session-token') {
      return NextResponse.json({
        success: true,
        message: 'デモユーザーは制限なしで利用できます',
        canUse: true,
        remainingUses: -1, // 制限なし
        dailyLimit: -1,
      });
    }

    // 無料プランユーザーの場合
    if (sessionCookie.value.startsWith('user-session-')) {
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
    }

    // その他のユーザーは制限なし
    return NextResponse.json({
      success: true,
      message: '制限なしで利用できます',
      canUse: true,
      remainingUses: -1,
      dailyLimit: -1,
    });

  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json(
      { error: '使用制限の確認に失敗しました' },
      { status: 500 }
    );
  }
}
