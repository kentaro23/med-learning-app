import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/server/require-session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id: cardSetId } = await params;
    
    // 既存のいいねを確認
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_cardSetId: {
          userId: (session.user as any).id,
          cardSetId: cardSetId,
        },
      },
    });

    if (existingLike) {
      // いいねを削除
      await prisma.like.delete({
        where: {
          userId_cardSetId: {
            userId: (session.user as any).id,
            cardSetId: cardSetId,
          },
        },
      });
      
      return NextResponse.json({
        success: true,
        liked: false,
      });
    } else {
      // いいねを追加
      await prisma.like.create({
        data: {
          userId: (session.user as any).id,
          cardSetId: cardSetId,
        },
      });
      
      return NextResponse.json({
        success: true,
        liked: true,
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    
    if ((error as any).status === 401) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
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
    const session = await requireSession();
    const { id: cardSetId } = await params;
    
    // いいね状態を確認
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_cardSetId: {
          userId: (session.user as any).id,
          cardSetId: cardSetId,
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      liked: !!existingLike,
    });
  } catch (error) {
    console.error('Error checking like status:', error);
    
    if ((error as any).status === 401) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'いいねの状態確認に失敗しました' },
      { status: 500 }
    );
  }
}
