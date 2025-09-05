import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { PrismaClient as DirectPrismaClient } from '@prisma/client';

async function withPrismaFallback<T>(fn: (client: any) => Promise<T>): Promise<T> {
  try {
    return await fn(prisma);
  } catch (e: any) {
    const msg = String(e?.message || e);
    const needFallback = msg.includes('Tenant or user not found') || msg.includes('P1000') || msg.includes('P1013') || msg.includes('P1001') || msg.includes('P1017');
    if (!needFallback || !process.env.DIRECT_URL) {
      throw e;
    }
    const direct = new DirectPrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } } });
    try {
      return await fn(direct);
    } finally {
      await direct.$disconnect().catch(() => {});
    }
  }
}

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

    // 既存確認（フォールバック対応）
    const exists = await withPrismaFallback((client) => client.user.findUnique({ where: { email: normEmail } }));

    // 既存ユーザーがいて、まだパスワード未設定なら「初回パスワード設定」として受理
    if (exists) {
      if (!exists.passwordHash) {
        const passwordHash = await bcrypt.hash(String(password), 10);
        await withPrismaFallback((client) => client.user.update({
          where: { id: exists.id },
          data: {
            passwordHash,
            name: (String(name || '').trim() || exists.name) ?? null,
            school: (String(school || '').trim() || exists.school) ?? null,
          },
        }));
        return NextResponse.json({ ok: true, updated: true });
      }
      return NextResponse.json({ error: 'exists' }, { status: 409 });
    }

    // 新規作成（フォールバック対応）
    try {
      const passwordHash = await bcrypt.hash(String(password), 10);
      await withPrismaFallback((client) => client.user.create({
        data: {
          email: normEmail,
          passwordHash,
          name: String(name || '').trim() || null,
          school: String(school || '').trim() || null,
        },
      }));
      return NextResponse.json({ ok: true });
    } catch (e: any) {
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
