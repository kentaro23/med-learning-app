import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test signup request received');
    
    const body = await request.json();
    console.log('📋 Request body:', body);
    
    // 簡単なテスト用のレスポンス
    return NextResponse.json({
      success: true,
      message: 'テスト用アカウントが作成されました',
      user: {
        id: 'test-user-123',
        name: body.name || 'テストユーザー',
        email: body.email || 'test@example.com',
        university: body.university || 'テスト大学',
        grade: body.grade || '1年生',
        major: body.major || 'テスト専攻',
      },
    });

  } catch (error) {
    console.error('Test signup error:', error);
    return NextResponse.json(
      { error: 'テスト用アカウントの作成に失敗しました' },
      { status: 500 }
    );
  }
}
