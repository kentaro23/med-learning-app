import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const signUpSchema = z.object({
  name: z.string().min(2, '名前は2文字以上で入力してください').max(50, '名前は50文字以下で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください').max(100, 'パスワードは100文字以下で入力してください'),
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
    
    const { name, email, password, university, grade, major } = signUpSchema.parse(body);
    console.log('✅ Data validation passed');

    // メールアドレスの正規化
    const normalizedEmail = String(email).toLowerCase().trim();

    // 既存ユーザーの確認
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
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
        email: normalizedEmail,
        passwordHash: passwordHash,
        university: university || '',
        grade: grade || '',
        major: major || '',
      } as any,
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

    console.log('✅ User created successfully:', { id: user.id, name, email: normalizedEmail });
    
    return NextResponse.json({
      success: true,
      message: 'アカウントが正常に作成されました',
      user,
    }, { status: 201 });

  } catch (error) {
    console.error('Sign up error:', error);
    
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(issue => issue.message).join(', ');
      return NextResponse.json(
        { error: `入力データに問題があります: ${errorMessages}` },
        { status: 400 }
      );
    }

    // Prismaエラーの詳細な処理
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'このメールアドレスは既に登録されています' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Database')) {
        return NextResponse.json(
          { error: 'データベースエラーが発生しました。しばらく時間をおいて再度お試しください。' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'アカウントの作成に失敗しました。しばらく時間をおいて再度お試しください。' },
      { status: 500 }
    );
  }
}
