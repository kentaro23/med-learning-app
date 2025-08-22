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
    
    // いいねが多い順にソートされた単語帳を取得
    const recommendedCardSets = await prisma.cardSet.findMany({
      where: {
        visibility: {
          in: ['public', 'unlisted']
        }
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
      orderBy: [
        { likes: { _count: 'desc' } },
        { createdAt: 'desc' }
      ],
      take: 20, // 上位20件を取得
    });

    return NextResponse.json({ 
      success: true,
      cardSets: recommendedCardSets 
    });
  } catch (error) {
    console.error('Error fetching recommended card sets:', error);
    return NextResponse.json(
      { error: 'リコメンド単語帳の取得に失敗しました' },
      { status: 500 }
    );
  }
}
