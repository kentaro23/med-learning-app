import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 一時的に認証をスキップ
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    // }

    const body = await request.json();
    const { cardSetId } = body;

    if (!cardSetId) {
      return NextResponse.json(
        { error: '単語帳IDが必要です' },
        { status: 400 }
      );
    }

    const { prisma } = await import('@/lib/prisma');
    
    // デモユーザーのID（実際の実装ではセッションから取得）
    const demoUserId = 'cmem7jgsq0000lfpt8nazchpg';
    
    // 単語帳の存在確認
    const cardSet = await prisma.cardSet.findUnique({
      where: { id: cardSetId },
      include: { owner: true },
    });

    if (!cardSet) {
      return NextResponse.json(
        { error: '単語帳が見つかりません' },
        { status: 404 }
      );
    }

    // 自分の単語帳の場合は追加できない
    if (cardSet.ownerId === demoUserId) {
      return NextResponse.json(
        { error: '自分の単語帳は既にホームに表示されています' },
        { status: 400 }
      );
    }

    // 既に追加済みかチェック（実際の実装では別テーブルで管理）
    // 現在は常に追加可能として扱う

    // ホームに追加（実際の実装では別テーブルに保存）
    // ここでは成功レスポンスを返す
    return NextResponse.json({ 
      success: true,
      message: '単語帳がホームに追加されました',
      cardSet: {
        id: cardSet.id,
        title: cardSet.title,
        description: cardSet.description,
        owner: cardSet.owner,
      }
    });
  } catch (error) {
    console.error('Error adding card set to home:', error);
    return NextResponse.json(
      { error: 'ホームへの追加に失敗しました' },
      { status: 500 }
    );
  }
}
