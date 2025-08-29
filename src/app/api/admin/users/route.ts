import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // セッション確認
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック（一時的にコメントアウト）
    // if (!(session.user as any)?.isAdmin) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    // 全ユーザーを取得
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        grade: true,
        major: true,
        createdAt: true,
        // isAdmin: true, // フィールドが存在しないため一時的にコメントアウト
        // lastLoginAt: true, // フィールドが存在しないため一時的にコメントアウト
        _count: {
          select: {
            cardSets: true,
            docs: true,
            likes: true,
            bookmarks: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // ユーザー統計を計算
    const stats = {
      totalUsers: users.length,
      totalCardSets: users.reduce((sum, user) => sum + user._count.cardSets, 0),
      totalDocs: users.reduce((sum, user) => sum + user._count.docs, 0),
      totalLikes: users.reduce((sum, user) => sum + user._count.likes, 0),
      totalBookmarks: users.reduce((sum, user) => sum + user._count.bookmarks, 0),
    };

    return NextResponse.json({
      success: true,
      users,
      stats
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
