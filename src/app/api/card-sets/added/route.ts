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
    
    // 現在は空の配列を返す（実際の実装では追加した単語帳のテーブルから取得）
    // 将来的には、ユーザーが追加した単語帳のIDリストを管理するテーブルを作成
    const addedCardSets: any[] = [];

    return NextResponse.json({ 
      success: true,
      cardSets: addedCardSets 
    });
  } catch (error) {
    console.error('Error fetching added card sets:', error);
    return NextResponse.json(
      { error: '追加した単語帳の取得に失敗しました' },
      { status: 500 }
    );
  }
}
