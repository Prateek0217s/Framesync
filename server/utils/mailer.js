// Automated event notifications (PDD §5.6.4 / Phase 7).
//
// SMTP is configured via env (see .env.example). When it is NOT configured we
// degrade gracefully: notifications are logged instead of sent, so local dev
// and tests never fail or block on a missing mail server — and nodemailer
// isn't even loaded (lazy require), so the API boots without the dependency
// installed. Every send is fire-and-forget — a mail outage must never fail
// the API request that triggered it.

let transporter = null;
let transportReady = false;

const smtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_FROM);

// Lazily create the transporter on first real use. Returns null when SMTP
// isn't configured or nodemailer isn't installed (in which case the caller
// logs and skips — dev machines without the mail stack still run fine).
const getTransporter = () => {
  if (transportReady) return transporter;
  transportReady = true;
  if (!smtpConfigured()) return null;
  try {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      ...(process.env.SMTP_USER
        ? {
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          }
        : {}),
    });
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.warn(
        '[mailer] SMTP is configured but nodemailer is not installed — run `npm install` in server/. Skipping mail.'
      );
    } else {
      throw err;
    }
    transporter = null;
  }
  return transporter;
};

// Best-effort send. Never throws; failures are logged only.
const sendMail = async ({ to, subject, html, text }) => {
  if (!to) return;
  const t = getTransporter();
  if (!t) {
    console.warn(`[mailer] SMTP not configured — skipping "${subject}" → ${to}`);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error(`[mailer] Failed to send "${subject}" to ${to}: ${err.message}`);
  }
};

module.exports = { sendMail, mailerConfigured: smtpConfigured };
