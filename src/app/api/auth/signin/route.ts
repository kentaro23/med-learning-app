import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = signInSchema.parse(body);

    console.log('🔐 Login attempt:', { email, passwordLength: password.length });

    // Prismaクライアントを動的インポート
    const { prisma } = await import('@/lib/prisma');

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    console.log('👤 User found:', user ? { id: user.id, name: user.name, hasPassword: !!user.password } : 'Not found');

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // パスワード検証
    let isValidPassword = false;
    
    if (user.password) {
      // データベースにパスワードが保存されている場合
      console.log('🔑 Comparing with stored password hash');
      isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔑 Password comparison result:', isValidPassword);
    } else {
      // デモ用アカウント（demo@med.ai）の場合
      console.log('🔑 No stored password, checking demo account');
      if (email === 'demo@med.ai' && password === 'password') {
        isValidPassword = true;
        console.log('🔑 Demo account password match');
      }
    }

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      );
    }

    console.log('✅ Login successful');

    // ログイン成功時のレスポンス
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    });

    // セッションクッキーを設定（デモ用）
    response.cookies.set('next-auth.session-token', 'demo-session-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7日間
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('❌ Sign in error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '無効なリクエストデータです' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    );
  }
}
