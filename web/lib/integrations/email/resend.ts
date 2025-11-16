import { logger } from '@/lib/utils/logger';

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? '';
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'no-reply@choices.app';

type EmailPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

export async function sendTransactionalEmail(payload: EmailPayload): Promise<{ id?: string; ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    logger.warn('RESEND_API_KEY missing; skipping email send');
    return { ok: false, error: 'missing_api_key' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      logger.error('Resend send error', { status: response.status, data });
      return { ok: false, error: data?.message ?? 'send_failed' };
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    logger.error('Resend exception', e instanceof Error ? e : new Error('Unknown error'));
    return { ok: false, error: 'exception' };
  }
}

