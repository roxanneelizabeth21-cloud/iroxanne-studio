/**
 * Shared branded email template for all iRoxanne Studio transactional emails.
 * One design system: plum header, gold accent, cream body, consistent footer.
 */

export function brandedEmail({ recipientFirstName, headline, body, ctaText, ctaUrl, footerNote }) {
  const name = recipientFirstName || 'there';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF7F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 20px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#2D2A4A 0%,#4A3F6B 100%);border-radius:16px 16px 0 0;padding:28px 32px 24px;">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;color:rgba(255,255,255,0.45);text-transform:uppercase;">iRoxanne Studio</p>
    <h1 style="margin:0;font-size:22px;font-weight:600;color:#fff;font-family:Georgia,'Cormorant Garamond',serif;">${headline}</h1>
  </div>
  <!-- Gold accent bar -->
  <div style="height:3px;background:linear-gradient(90deg,#C9A84C 0%,#E8D5A0 50%,#C9A84C 100%);"></div>

  <!-- Body -->
  <div style="background:#ffffff;padding:32px 32px 28px;border-left:1px solid rgba(45,42,74,0.06);border-right:1px solid rgba(45,42,74,0.06);">
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2D2A4A;">Hi ${name},</p>
    ${body}
    ${ctaText && ctaUrl ? `
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="${ctaUrl}" style="display:inline-block;background:#2D2A4A;color:#fff;font-weight:600;padding:14px 32px;border-radius:50px;text-decoration:none;font-size:14px;letter-spacing:0.01em;">${ctaText}</a>
    </div>` : ''}
  </div>

  <!-- Footer -->
  <div style="background:#FAF7F0;border:1px solid rgba(45,42,74,0.06);border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
    ${footerNote ? `<p style="margin:0 0 12px;font-size:12px;color:rgba(45,42,74,0.4);line-height:1.5;">${footerNote}</p>` : ''}
    <p style="margin:0;font-size:11px;color:rgba(45,42,74,0.3);">iRoxanne Studio &middot; Custom apps for small businesses</p>
  </div>

</div>
</body>
</html>`;
}

export const EMAIL_TEMPLATES = {
  quoteConfirmation: (name) => brandedEmail({
    recipientFirstName: name,
    headline: 'We got your project details',
    body: `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(45,42,74,0.65);">Thanks for reaching out. I've received your project details and I'm reviewing them now.</p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(45,42,74,0.65);">I'll follow up within <strong style="color:#2D2A4A;">2 business days</strong> with a custom proposal. If you have any questions in the meantime, reply to this email.</p>`,
    footerNote: 'You submitted a quote request at iRoxanne Studio.',
  }),

  contractSent: (name, projectTitle, contractUrl) => brandedEmail({
    recipientFirstName: name,
    headline: `Your agreement for ${projectTitle}`,
    body: `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(45,42,74,0.65);">Your project agreement is ready to review and sign. Take a look at the scope, pricing, and terms — then sign electronically when you're ready.</p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(45,42,74,0.65);">Once signed, I'll send you a content intake form so we can get started right away.</p>`,
    ctaText: 'Review & Sign',
    ctaUrl: contractUrl,
    footerNote: 'This agreement was prepared by iRoxanne Studio.',
  }),

  intakeSent: (name, projectTitle, intakeUrl) => brandedEmail({
    recipientFirstName: name,
    headline: `Let's get started on ${projectTitle}`,
    body: `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(45,42,74,0.65);">To build your app as fast and accurately as possible, I need your content — text, images, documents, and details about how your business works.</p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(45,42,74,0.65);">I've set up a form organized by page. Fill in what you can, upload your files, and save your progress anytime. The more you provide upfront, the faster I can deliver.</p>`,
    ctaText: 'Fill Out Your Intake Form',
    ctaUrl: intakeUrl,
    footerNote: 'You can save and return to this form anytime using the same link.',
  }),

  depositRequest: (name, projectTitle, amount, paymentUrl) => brandedEmail({
    recipientFirstName: name,
    headline: `Deposit request — ${projectTitle}`,
    body: `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(45,42,74,0.65);">Your project is ready to begin. The deposit to start work is:</p>
    <div style="text-align:center;margin:20px 0;">
      <span style="font-size:32px;font-weight:700;color:#2D2A4A;font-family:Georgia,'Cormorant Garamond',serif;">$${amount}</span>
    </div>
    <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(45,42,74,0.65);">Click below to pay securely. Once the deposit is received, I'll start building.</p>`,
    ctaText: 'Pay Now',
    ctaUrl: paymentUrl,
    footerNote: 'This deposit request was sent by iRoxanne Studio.',
  }),

  balanceRequest: (name, projectTitle, amount, paymentUrl) => brandedEmail({
    recipientFirstName: name,
    headline: `Final balance — ${projectTitle}`,
    body: `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(45,42,74,0.65);">Your project is complete and ready for handoff. The remaining balance is:</p>
    <div style="text-align:center;margin:20px 0;">
      <span style="font-size:32px;font-weight:700;color:#2D2A4A;font-family:Georgia,'Cormorant Garamond',serif;">$${amount}</span>
    </div>
    <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(45,42,74,0.65);">Once paid, I'll hand over all access and deliverables.</p>`,
    ctaText: 'Pay Final Balance',
    ctaUrl: paymentUrl,
    footerNote: 'This payment request was sent by iRoxanne Studio.',
  }),
};
