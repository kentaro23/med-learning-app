import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateMedicalQuestions } from '@/lib/openai';
import { checkUsageLimit, incrementUsage } from '@/lib/usage-limits';

const requestSchema = z.object({
  topic: z.string().min(1, 'トピックを入力してください'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().min(1).max(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 API received body:', body);
    console.log('📊 Body type check:', {
      topic: typeof body.topic,
      difficulty: typeof body.difficulty,
      count: typeof body.count,
      difficultyValue: body.difficulty
    });
    
    const { topic, difficulty, count } = requestSchema.parse(body);
    console.log('✅ Parsed data:', { topic, difficulty, count });

    // セッションクッキーからユーザー情報を取得
    const sessionCookie = request.cookies.get('next-auth.session-token');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // デモユーザーの場合は特別処理
    let userId = 'demo-user-id';
    
    // セッションクッキーがデモセッションの場合は、実際のデモユーザーIDを使用
    if (sessionCookie.value === 'demo-session-token') {
      // データベースからデモユーザーを検索
      const { prisma } = await import('@/lib/prisma');
      
      try {
        const demoUser = await prisma.user.findUnique({
          where: { email: 'demo@med.ai' },
          select: { id: true }
        });
        
        if (demoUser) {
          userId = demoUser.id;
        }
      } catch (error) {
        console.error('Demo user lookup error:', error);
      }
    }

    // 使用制限チェック
    const usageCheck = await checkUsageLimit(userId, 'aiQuestions');
    
    if (!usageCheck.canUse) {
      console.log('❌ Usage limit exceeded:', usageCheck.message);
      return NextResponse.json(
        { 
          error: '使用制限に達しました',
          details: usageCheck.message,
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit,
          remaining: usageCheck.remaining
        }, 
        { status: 429 }
      );
    }

    console.log('✅ Usage limit check passed:', usageCheck.message);

    // OpenAI APIを使用して問題を生成
    const questions = await generateMedicalQuestions(topic, difficulty, count);

    // 使用回数をインクリメント
    await incrementUsage(userId, 'aiQuestions');

    return NextResponse.json({ 
      questions,
      usage: {
        currentUsage: usageCheck.currentUsage + 1,
        limit: usageCheck.limit,
        remaining: usageCheck.remaining - 1,
        message: `残り${usageCheck.remaining - 1}回利用可能`
      }
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    
    if (error instanceof z.ZodError) {
      console.error('🔴 Zod validation errors:', error.errors);
      return NextResponse.json(
        { error: '無効なリクエストデータです', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '問題の生成に失敗しました' },
      { status: 500 }
    );
  }
}
