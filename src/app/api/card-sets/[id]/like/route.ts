import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardSetId } = await params;
    
    // シンプルないいね切り替え（モック実装）
    // TODO: 後でPrismaを使用した完全な実装に置き換え
    return NextResponse.json({
      success: true,
      liked: true, // 常にいいね済みとして返す（モック）
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'いいねの操作に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardSetId } = await params;
    
    // シンプルないいね状態確認（モック実装）
    // TODO: 後でPrismaを使用した完全な実装に置き換え
    return NextResponse.json({
      success: true,
      liked: false, // デフォルトでいいねなし
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'いいねの状態確認に失敗しました' },
      { status: 500 }
    );
  }
}

// Optional: avoid static optimization on API route
export const dynamic = 'force-dynamic';
