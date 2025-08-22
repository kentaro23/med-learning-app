import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    const cardSetId = params.id;

    const { prisma } = await import('@/lib/prisma');
    
    // 単語帳の詳細情報を取得
    const cardSet = await prisma.cardSet.findUnique({
      where: { id: cardSetId },
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
    });

    if (!cardSet) {
      return NextResponse.json(
        { error: '単語帳が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cardSet: {
        id: cardSet.id,
        title: cardSet.title,
        description: cardSet.description,
        visibility: cardSet.visibility,
        tags: cardSet.tags,
        createdAt: cardSet.createdAt,
        updatedAt: cardSet.updatedAt,
        owner: cardSet.owner,
        _count: cardSet._count,
      },
    });

  } catch (error) {
    console.error('Error fetching card set:', error);
    return NextResponse.json(
      { error: '単語帳の取得に失敗しました' },
      { status: 500 }
    );
  }
}
