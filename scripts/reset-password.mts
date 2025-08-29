import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

function parseArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  const envKey = flag.replace(/^--/, '').toUpperCase();
  return process.env[envKey];
}

async function main() {
  const emailRaw = parseArg('--email');
  const password = parseArg('--password');

  if (!emailRaw || !password) {
    console.error('Usage: tsx scripts/reset-password.mts --email <email> --password <newPassword>');
    process.exit(1);
  }

  const email = String(emailRaw).toLowerCase().trim();
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error('User not found for email:', email);
      process.exit(2);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    console.log('Password updated for user:', user.id);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Failed to reset password:', err);
  process.exit(3);
});


