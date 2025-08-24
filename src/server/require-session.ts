import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  return session;
}
