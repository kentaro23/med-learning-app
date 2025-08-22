import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signUpSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  university: z.string().min(1),
  grade: z.string().min(1),
  major: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Sign up request received');
    
    const body = await request.json();
    console.log('📋 Request body:', { ...body, password: '[HIDDEN]' });
    
    const { name, email, password, university, grade, major } = signUpSchema.parse(body);
    console.log('✅ Data validation passed');

    // Prismaクライアントを動的インポート
    const { prisma } = await import('@/lib/prisma');
    console.log('🔌 Prisma client imported successfully');

    // メールアドレスの重複チェック
    console.log('🔍 Checking for existing user with email:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('❌ User already exists with email:', email);
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 409 }
      );
    }
    console.log('✅ No existing user found');

    // パスワードのハッシュ化
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Password hashed successfully');

    // ユーザーの作成
    console.log('👤 Creating user with data:', { name, email, university, grade, major });
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // パスワードを保存
        university,
        grade,
        major,
      },
    });
    console.log('✅ User created successfully:', { id: user.id, name: user.name, email: user.email });

    // パスワードを除いたユーザー情報を返す
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'アカウントが正常に作成されました',
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Sign up error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '無効なリクエストデータです', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'アカウントの作成に失敗しました' },
      { status: 500 }
    );
  }
}
