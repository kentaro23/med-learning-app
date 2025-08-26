import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const signUpSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  university: z.string().min(1, '大学名を入力してください'),
  grade: z.string().min(1, '学年を選択してください'),
  major: z.string().min(1, '専攻を入力してください'),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Sign up request received');
    
    const body = await request.json();
    console.log('📋 Request body:', { ...body, password: '[HIDDEN]' });
    
    const { name, email, password, university, grade, major } = signUpSchema.parse(body);
    console.log('✅ Data validation passed');

    // メールアドレスの正規化
    const e = String(email).toLowerCase().trim();

    // 既存ユーザーの確認
    const existingUser = await prisma.user.findUnique({
      where: { email: e }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }

    // パスワードのハッシュ化
    const passwordHash = await bcrypt.hash(password, 12);

    // ユーザーの作成
    const user = await prisma.user.create({
      data: {
        name,
        email: e,
        passwordHash: passwordHash,
        university: university,
        grade: grade,
        major: major,
      },
      select: {
        id: true,
        name: true,
        email: true,
        university: true,
        grade: true,
        major: true,
        createdAt: true,
      }
    });

    console.log('✅ User created successfully:', { id: user.id, name, email });
    
    return NextResponse.json({
      success: true,
      message: 'アカウントが正常に作成されました',
      user,
    }, { status: 201 });

  } catch (error) {
    console.error('Sign up error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '無効なリクエストデータです', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `アカウントの作成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}` },
      { status: 500 }
    );
  }
}
