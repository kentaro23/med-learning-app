import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, name, school } = await req.json();

    // 入力検証
    if (!email || !password) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }
    const normEmail = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'weak_password' }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: normEmail } });

    // 既存ユーザーがいて、まだパスワード未設定なら「初回パスワード設定」として受理
    if (exists) {
      if (!exists.passwordHash) {
        const passwordHash = await bcrypt.hash(String(password), 10);
        await prisma.user.update({
          where: { id: exists.id },
          data: {
            passwordHash,
            name: (String(name || '').trim() || exists.name) ?? null,
            school: (String(school || '').trim() || exists.school) ?? null,
          },
        });
        return NextResponse.json({ ok: true, updated: true });
      }
      return NextResponse.json({ error: 'exists' }, { status: 409 });
    }

    // 新規作成
    try {
      const passwordHash = await bcrypt.hash(String(password), 10);
      await prisma.user.create({
        data: {
          email: normEmail,
          passwordHash,
          name: String(name || '').trim() || null,
          school: String(school || '').trim() || null,
        },
      });
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      // 一意制約違反（レースなどで発生）
      if (e?.code === 'P2002') {
        return NextResponse.json({ error: 'exists' }, { status: 409 });
      }
      console.error('signup create error:', e);
      return NextResponse.json({ error: 'internal' }, { status: 500 });
    }
  } catch (e: any) {
    console.error('signup error', e?.message || e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
