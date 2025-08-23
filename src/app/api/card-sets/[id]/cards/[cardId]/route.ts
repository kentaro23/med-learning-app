import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    // 一時的に認証をスキップ
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.email) {
    //   return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    // }

    const { id: cardSetId, cardId } = await params;
    const { prisma } = await import('@/lib/prisma');
    
    // カードの存在確認
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { cardSet: { include: { owner: true } } },
    });

    if (!card) {
      return NextResponse.json(
        { error: 'カードが見つかりません' },
        { status: 404 }
      );
    }

    // カードを削除
    await prisma.card.delete({
      where: { id: cardId },
    });

    return NextResponse.json({ 
      message: 'カードが正常に削除されました' 
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: 'カードの削除に失敗しました' },
      { status: 500 }
    );
  }
}
