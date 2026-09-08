const { sendMail } = require('./mailer');

// Branded HTML email templates for the automated event notifications
// (PDD Phase 7). Shared shell first, then one builder per event.

const shell = (title, bodyHtml) => `
  <div style="font-family:Inter,-apple-system,Segoe UI,sans-serif;background:#f4f4f7;padding:32px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(15,15,25,0.08)">
          <tr>
            <td style="background:#0B0B12;padding:20px 32px">
              <span style="font-size:16px;font-weight:700;color:#ffffff;letter-spacing:0.5px">
                Frame<span style="color:#A78BFA">Sync</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px">
              <h1 style="margin:0 0 16px;font-size:19px;color:#15151F">${title}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #eeeef2;
                       font-size:12px;color:#8a8a98;line-height:1.5">
              Sent automatically by FrameSync — please do not reply to this email.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </div>`;

const p = (text) =>
  `<p style="margin:0 0 14px;font-size:14px;color:#3f3f4c;line-height:1.6">${text}</p>`;

const cta = (url, label) => `
  <p style="margin:24px 0 8px">
    <a href="${url}"
       style="display:inline-block;background:#7C3AED;color:#ffffff;text-decoration:none;
              font-size:14px;font-weight:600;padding:11px 22px;border-radius:8px">
      ${label}
    </a>
  </p>
  <p style="margin:0;font-size:12px;color:#8a8a98;word-break:break-all">${url}</p>`;

// 1. Magic review link sent to the client reviewer (PDD FR-5.1.2).
const sendReviewLinkEmail = ({ to, clientName, projectTitle, url, expiresAt }) =>
  sendMail({
    to,
    subject: `FrameSync — your review link for “${projectTitle}”`,
    html: shell(
      'Your review is ready',
      p(`Hi ${clientName},`) +
        p(`A new video review for <strong>${projectTitle}</strong> is ready for your feedback. ` +
          'Open the secure link below — no account or password needed. You can pause the ' +
          'video, sketch directly on any frame, and leave timestamped comments.') +
        cta(url, 'Open the review') +
        p(`This link expires on <strong>${new Date(expiresAt).toUTCString()}</strong>. ` +
          'Please don’t forward it — it’s scoped to your review.')
    ),
    text: `Hi ${clientName}, a new video review for "${projectTitle}" is ready: ${url}\nThis link expires on ${new Date(expiresAt).toUTCString()}.`,
  });

// 2. New client comment → notify the agency admins (PDD FR-5.6.4).
const sendClientCommentEmail = ({ to, authorName, projectTitle, text, timestamp }) =>
  sendMail({
    to,
    subject: `FrameSync — new feedback on “${projectTitle}”`,
    html: shell(
      'New client feedback',
      p(`<strong>${authorName}</strong> left feedback on <strong>${projectTitle}</strong> ` +
        (timestamp !== undefined ? `at <code>${timestamp}s</code>.` : '.')) +
        p(
          `<div style="background:#f7f7fa;border-left:3px solid #7C3AED;border-radius:6px;` +
            `padding:12px 16px;font-size:14px;color:#3f3f4c">${
              text || '(frame scribble only — no text)'
            }</div>`
        )
    ),
    text: `${authorName} left feedback on "${projectTitle}"${timestamp !== undefined ? ` at ${timestamp}s` : ''}: ${text || '(frame scribble only)'}.`,
  });

// 3. Digital sign-off → notify the agency admins (Level Lock unlock, §5.5).
const sendApprovalEmail = ({ to, clientName, projectTitle }) =>
  sendMail({
    to,
    subject: `FrameSync — “${projectTitle}” approved ✓`,
    html: shell(
      'Project approved',
      p(`<strong>${clientName}</strong> has digitally signed off on ` +
        `<strong>${projectTitle}</strong>.`) +
      p('The Level Lock on the master asset has been released — the 4K master ' +
        'is now downloadable from the project page. The signed approval record ' +
        '(signatory, timestamp, IP) is attached to the project for audit.')
    ),
    text: `${clientName} has digitally signed off on "${projectTitle}". The master asset is unlocked.`,
  });

module.exports = {
  sendReviewLinkEmail,
  sendClientCommentEmail,
  sendApprovalEmail,
};
