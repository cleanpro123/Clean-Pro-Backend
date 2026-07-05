const nodemailer = require('nodemailer');
const env = require('../../config/env');
const logger = require('../../config/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.email.user || !env.email.pass) return null;
  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: { user: env.email.user, pass: env.email.pass },
  });
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) {
    // No SMTP configured — log the message instead of failing (dev convenience).
    logger.warn(
      { to, subject, text },
      'Email not configured (EMAIL_USER / EMAIL_APP_PASSWORD missing) — skipping real send'
    );
    return { skipped: true };
  }
  const info = await tx.sendMail({ from: env.email.from, to, subject, text, html });
  logger.info({ to, subject, messageId: info.messageId }, 'Email sent');
  return info;
}

function otpEmail(code, ttlMinutes) {
  const subject = 'Your Clean Pro verification code';
  const text = `Your Clean Pro verification code is ${code}. It expires in ${ttlMinutes} minutes.`;
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:440px;margin:0 auto;padding:24px;color:#0f172a">
    <div style="text-align:center;margin-bottom:16px">
      <div style="display:inline-block;background:#1B6FC4;color:#fff;font-weight:800;font-size:18px;border-radius:14px;padding:10px 16px">Clean Pro</div>
    </div>
    <h2 style="font-size:18px;margin:0 0 8px">Verify your email</h2>
    <p style="font-size:14px;color:#475569;margin:0 0 20px">Use this code to finish creating your Clean Pro account. It expires in ${ttlMinutes} minutes.</p>
    <div style="font-size:34px;font-weight:800;letter-spacing:10px;text-align:center;background:#EAF4FF;color:#1B6FC4;border-radius:14px;padding:18px 0">${code}</div>
    <p style="font-size:12px;color:#94a3b8;margin:20px 0 0">If you didn't request this, you can safely ignore this email.</p>
  </div>`;
  return { subject, text, html };
}

module.exports = { sendMail, otpEmail };
