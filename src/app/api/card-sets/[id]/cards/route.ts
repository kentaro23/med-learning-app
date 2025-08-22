import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const addCardSchema = z.object({
  question: z.string().min(1, '問題は必須です'),
  answer: z.string().min(1, '答えは必須です'),
  source: z.string().optional(),
});

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
    
    const cards = await prisma.card.findMany({
      where: {
        cardSetId: params.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { error: 'カードの取得に失敗しました' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const validatedData = addCardSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');
    
    // カードセットの存在確認
    const cardSet = await prisma.cardSet.findUnique({
      where: { id: params.id },
      include: { owner: true },
    });

    if (!cardSet) {
      return NextResponse.json(
        { error: 'カードセットが見つかりません' },
        { status: 404 }
      );
    }

    // 新しいカードを作成
    const newCard = await prisma.card.create({
      data: {
        question: validatedData.question,
        answer: validatedData.answer,
        source: validatedData.source,
        cardSetId: params.id,
      },
    });

    return NextResponse.json({ 
      message: 'カードが正常に追加されました',
      card: newCard 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '無効なリクエストデータです', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error adding card:', error);
    return NextResponse.json(
      { error: 'カードの追加に失敗しました' },
      { status: 500 }
    );
  }
}
