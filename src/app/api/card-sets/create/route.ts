import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession } from '@/server/require-session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const createCardSetSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  visibility: z.enum(['private', 'unlisted', 'public']),
  category: z.string().min(1, 'カテゴリは必須です'),
  subcategory: z.string().min(1, 'サブカテゴリは必須です'),
  tags: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const validatedData = createCardSetSchema.parse(body);

    // 単語帳を作成
    const cardSet = await prisma.cardSet.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        visibility: validatedData.visibility,
        tags: `${validatedData.category},${validatedData.subcategory}${validatedData.tags ? ',' + validatedData.tags : ''}`,
        ownerId: (session.user as any).id,
      },
      include: {
        owner: {
          select: {
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

    return NextResponse.json({
      success: true,
      cardSet,
      message: '単語帳が正常に作成されました'
    });

  } catch (error) {
    console.error('Card set creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '無効なリクエストデータです', details: error },
        { status: 400 }
      );
    }
    
    if ((error as any).status === 401) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: '単語帳の作成に失敗しました' },
      { status: 500 }
    );
  }
}
