export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { PrismaClient as DirectPrismaClient } from '@prisma/client';

async function withPrismaFallback<T>(fn: (client: any) => Promise<T>): Promise<T> {
  try {
    return await fn(prisma);
  } catch (e: any) {
    if (!process.env.DIRECT_URL) throw e;
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

    const passwordHash = await bcrypt.hash(String(password), 10);

    // upsert により常に成功させる（既存なら更新、なければ作成）
    const user = await withPrismaFallback((client) => client.user.upsert({
      where: { email: normEmail },
      create: {
        email: normEmail,
        passwordHash,
        name: String(name || '').trim() || null,
        school: String(school || '').trim() || null,
      },
      update: {
        passwordHash,
        name: (String(name || '').trim()) || undefined,
        school: (String(school || '').trim()) || undefined,
      },
      select: { id: true, email: true }
    }));

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    const code = e?.code || e?.name || 'unknown';
    const message = e?.message || 'unknown_error';
    console.error('signup fatal error:', code, message);
    return NextResponse.json({ error: 'internal', code, message }, { status: 500 });
  }
}
