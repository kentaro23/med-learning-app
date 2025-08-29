import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password, name, school } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'missing' }, { status: 400 });

    const normEmail = String(email).toLowerCase().trim();
    const exists = await prisma.user.findUnique({ where: { email: normEmail } });
    if (exists) return NextResponse.json({ error: 'exists' }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: normEmail,
        passwordHash,
        name: name?.trim() || null,
        school: school?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('signup error', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
