import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: '検索クエリが必要です' }, { status: 400 });
    }

    const searchTerm = query.trim();
    const searchTermLower = searchTerm.toLowerCase();
    const results = [];

    // 単語帳（CardSet）の検索
    if (type === 'all' || type === 'cardSet') {
      const cardSets = await prisma.cardSet.findMany({
        where: {
          OR: [
            { title: { contains: searchTermLower } },
            { description: { contains: searchTermLower } },
            { tags: { contains: searchTermLower } }
          ],
          visibility: { in: ['public', 'unlisted'] }
        },
        include: {
          owner: { select: { name: true } },
          _count: { select: { cards: true } }
        },
        take: 10
      });

      results.push(...cardSets.map(cardSet => ({
        id: cardSet.id,
        type: 'cardSet' as const,
        title: cardSet.title,
        description: cardSet.description,
        tags: cardSet.tags,
        owner: cardSet.owner?.name || '不明',
        createdAt: cardSet.createdAt.toISOString(),
        url: `/card-sets/${cardSet.id}`,
        cardCount: cardSet._count.cards
      })));
    }

    // カード（Card）の検索
    if (type === 'all' || type === 'card') {
      const cards = await prisma.card.findMany({
        where: {
          OR: [
            { question: { contains: searchTermLower } },
            { answer: { contains: searchTermLower } },
            { source: { contains: searchTermLower } }
          ]
        },
        include: {
          cardSet: {
            select: {
              id: true,
              title: true,
              visibility: true,
              owner: { select: { name: true } }
            }
          }
        },
        take: 10
      });

      // 公開されている単語帳のカードのみを結果に含める
      const publicCards = cards.filter(card => 
        card.cardSet.visibility === 'public' || card.cardSet.visibility === 'unlisted'
      );

      results.push(...publicCards.map(card => ({
        id: card.id,
        type: 'card' as const,
        title: card.question.length > 50 ? card.question.substring(0, 50) + '...' : card.question,
        description: `回答: ${card.answer}`,
        tags: card.source || '',
        owner: card.cardSet.owner?.name || '不明',
        createdAt: card.createdAt.toISOString(),
        url: `/card-sets/${card.cardSet.id}`,
        cardSetTitle: card.cardSet.title
      })));
    }

    // PDF資料（Doc）の検索
    if (type === 'all' || type === 'pdf') {
      const docs = await prisma.doc.findMany({
        where: {
          OR: [
            { title: { contains: searchTermLower } }
          ],
          visibility: { in: ['public', 'unlisted'] }
        },
        include: {
          owner: { select: { name: true } },
          _count: { select: { clozes: true } }
        },
        take: 10
      });

      results.push(...docs.map(doc => ({
        id: doc.id,
        type: 'pdf' as const,
        title: doc.title,
        description: `穴埋め問題: ${doc._count.clozes}問`,
        tags: '',
        owner: doc.owner?.name || '不明',
        createdAt: doc.createdAt.toISOString(),
        url: `/pdf-cloze/${doc.id}`,
        clozeCount: doc._count.clozes
      })));
    }

    // 結果を関連性でソート（タイトルマッチ > 説明マッチ > タグマッチ）
    const sortedResults = results.sort((a, b) => {
      const aScore = getRelevanceScore(a, searchTerm);
      const bScore = getRelevanceScore(b, searchTerm);
      return bScore - aScore;
    });

    return NextResponse.json({
      success: true,
      query: searchTerm,
      type: type,
      results: sortedResults.slice(0, 20), // 最大20件まで
      total: sortedResults.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: '検索中にエラーが発生しました' }, { status: 500 });
  }
}

// 関連性スコアを計算する関数
function getRelevanceScore(result: any, searchTerm: string): number {
  let score = 0;
  const term = searchTerm.toLowerCase();

  // タイトルマッチ（最高スコア）
  if (result.title.toLowerCase().includes(term)) {
    score += 100;
  }

  // 説明マッチ
  if (result.description && result.description.toLowerCase().includes(term)) {
    score += 50;
  }

  // タグマッチ
  if (result.tags && result.tags.toLowerCase().includes(term)) {
    score += 30;
  }

  // 作成日が新しいほど高スコア
  const daysSinceCreation = Math.floor((Date.now() - new Date(result.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  score += Math.max(0, 30 - daysSinceCreation);

  return score;
}
