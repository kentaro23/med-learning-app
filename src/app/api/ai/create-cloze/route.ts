import { NextRequest, NextResponse } from 'next/server';
import { createClozeFromText } from '@/lib/openai';
import { z } from 'zod';

const requestSchema = z.object({
  text: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = requestSchema.parse(body);

    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'テキストが長すぎます。10,000文字以下にしてください。' },
        { status: 400 }
      );
    }

    // OpenAI APIを使用して穴埋め問題を生成
    const cloze = await createClozeFromText(text);

    return NextResponse.json({ cloze });
  } catch (error) {
    console.error('Error creating cloze:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '無効なリクエストデータです' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '穴埋め問題の生成に失敗しました' },
      { status: 500 }
    );
  }
}
