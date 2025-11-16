type TemplateResult = { subject: string; text: string; html: string };

export function verificationCodeTemplate(code: string): TemplateResult {
  const subject = 'Your Choices verification code';
  const text = `Your verification code is ${code}. It expires in 15 minutes. If you did not request this, you can ignore this email.`;
  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111;">
    <h2 style="margin:0 0 12px 0;">Your verification code</h2>
    <p style="margin:0 0 12px 0;">Use this code to verify your official email:</p>
    <p style="font-size:20px; font-weight:600; letter-spacing:2px; margin:0 0 16px 0;"><code>${code}</code></p>
    <p style="margin:0 0 12px 0;">The code expires in 15 minutes.</p>
    <p style="font-size:12px; color:#666; margin-top:24px;">If you did not request this, you can ignore this email.</p>
  </div>`;
  return { subject, text, html };
}

export function welcomeCandidateTemplate(displayName: string): TemplateResult {
  const subject = 'Welcome to Choices';
  const text = `Welcome ${displayName || ''}! Your candidate profile has been created. You can complete your details and publish when ready.`;
  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111;">
    <h2 style="margin:0 0 12px 0;">Welcome${displayName ? `, ${displayName}` : ''}!</h2>
    <p style="margin:0 0 12px 0;">Your candidate profile has been created. Complete your details and publish when ready.</p>
  </div>`;
  return { subject, text, html };
}

export function publishCongratsTemplate(displayName: string, publicUrl: string): TemplateResult {
  const subject = 'Your candidate profile is live';
  const text = `Congrats ${displayName || ''}! Your profile is now public: ${publicUrl}`;
  const html = `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111;">
    <h2 style="margin:0 0 12px 0;">Your profile is live${displayName ? `, ${displayName}` : ''}!</h2>
    <p style="margin:0 0 12px 0;">Share your public page:</p>
    <p style="margin:0;"><a href="${publicUrl}" target="_blank" rel="noreferrer">${publicUrl}</a></p>
  </div>`;
  return { subject, text, html };
}

