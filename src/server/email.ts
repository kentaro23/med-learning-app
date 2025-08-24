import { Resend } from 'resend';

const key = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM; // e.g., "Med Learning <noreply@yourdomain>"
let client: Resend | null = null;

export async function sendWelcomeEmail({ email, name }: { email: string; name?: string }) {
  if (!key || !from) {
    console.log('📧 Email not configured: missing RESEND_API_KEY or EMAIL_FROM');
    return;
  }
  
  if (!client) client = new Resend(key);
  
  try {
    await client.emails.send({
      from,
      to: email,
      subject: 'ご登録ありがとうございます',
      text: `こんにちは${name ? `、${name}` : ''} さん。\nMed Learning へのご登録ありがとうございます！\n学習を始めましょう。`,
    });
    console.log('📧 Welcome email sent successfully to:', email);
  } catch (e) {
    // swallow errors; do not block signup
    console.error('📧 sendWelcomeEmail failed:', e);
  }
}
