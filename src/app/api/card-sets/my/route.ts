import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 一時的に認証をスキップ
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    // }

    const { prisma } = await import('@/lib/prisma');
    
    // デモユーザーのID（実際の実装ではセッションから取得）
    const demoUserId = 'cmem7jgsq0000lfpt8nazchpg';
    
    const cardSets = await prisma.cardSet.findMany({
      where: {
        ownerId: demoUserId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            cards: true,
            likes: true,
            bookmarks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ 
      success: true,
      cardSets 
    });
  } catch (error) {
    console.error('Error fetching user card sets:', error);
    return NextResponse.json(
      { error: '単語帳の取得に失敗しました' },
      { status: 500 }
    );
  }
}
