import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const signUpSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  school: z.string().optional(),
  university: z.string().optional(),
  grade: z.string().optional(),
  major: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Sign up request received');
    
    const body = await request.json();
    console.log('📋 Request body:', { ...body, password: '[HIDDEN]' });
    
    const { name, email, password, school, university, grade, major } = signUpSchema.parse(body);
    console.log('✅ Data validation passed');

    // 既存ユーザーの確認
    const existingUser = await prisma.user.findUnique({
      where: { email }
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
        email,
        password: passwordHash, // 既存のpasswordフィールドを使用
        school: school || null,
        university: university || null,
        grade: grade || null,
        major: major || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        school: true,
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
