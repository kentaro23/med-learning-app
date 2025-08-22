import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 一時的に認証をスキップ
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    // }

    const { prisma } = await import('@/lib/prisma');
    
    // デモユーザーのID（実際の実装ではセッションから取得）
    const demoUserId = 'cmem7jgsq0000lfpt8nazchpg';
    const cardSetId = params.id;

    // カードセットの存在確認
    const cardSet = await prisma.cardSet.findUnique({
      where: { id: cardSetId },
    });

    if (!cardSet) {
      return NextResponse.json(
        { error: 'カードセットが見つかりません' },
        { status: 404 }
      );
    }

    // 既存のいいねを確認
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: demoUserId,
        cardSetId: cardSetId,
      },
    });

    if (existingLike) {
      // 既にいいね済みの場合は削除（いいねを取り消し）
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      return NextResponse.json({
        success: true,
        message: 'いいねを取り消しました',
        liked: false,
      });
    } else {
      // いいねを追加
      await prisma.like.create({
        data: {
          userId: demoUserId,
          cardSetId: cardSetId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'いいねを追加しました',
        liked: true,
      });
    }
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
  { params }: { params: { id: string } }
) {
  try {
    // 一時的に認証をスキップ
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    // }

    const { prisma } = await import('@/lib/prisma');
    
    // デモユーザーのID（実際の実装ではセッションから取得）
    const demoUserId = 'cmem7jgsq0000lfpt8nazchpg';
    const cardSetId = params.id;

    // いいねの状態を確認
    const like = await prisma.like.findFirst({
      where: {
        userId: demoUserId,
        cardSetId: cardSetId,
      },
    });

    return NextResponse.json({
      success: true,
      liked: !!like,
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'いいねの状態確認に失敗しました' },
      { status: 500 }
    );
  }
}
