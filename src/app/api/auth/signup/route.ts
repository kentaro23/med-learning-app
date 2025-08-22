import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signUpSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = signUpSchema.parse(body);

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 409 }
      );
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // ユーザーの作成
    const user = await prisma.user.create({
      data: {
        name,
        email,
        // 実際の実装では hashedPassword を保存
        // password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('Sign up error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '無効なリクエストデータです' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'アカウントの作成に失敗しました' },
      { status: 500 }
    );
  }
}
