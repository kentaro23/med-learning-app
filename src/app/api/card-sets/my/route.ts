import { NextResponse } from 'next/server';
import { requireSession } from '@/server/require-session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireSession();
    
    const cardSets = await prisma.cardSet.findMany({
      where: { ownerId: (session.user as any).id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            cards: true,
            likes: true,
            bookmarks: true,
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      cardSets,
    });
  } catch (error) {
    console.error('Error fetching my card sets:', error);
    
    if ((error as any).status === 401) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'カードセットの取得に失敗しました' },
      { status: 500 }
    );
  }
}
