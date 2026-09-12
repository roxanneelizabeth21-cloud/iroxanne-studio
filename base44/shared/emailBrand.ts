// Shared branded HTML email shell so every email the app sends looks like iRoxanne Studio:
// plum header wordmark, warm cream body, consistent footer, aligned with the site palette.
export const BRAND_PLUM = '#2D2A4A';
export const BRAND_PLUM_LIGHT = '#4A3F6B';
export const BRAND_CREAM = '#FAF7F0';
export const BRAND_PLUM_DARK = '#2D2A4A';
export const BRAND_GOLD = '#C9A84C';

export function brandButton(label: string, url: string): string {
  return `<a href="${esc(url)}" style="display:inline-block;background:${BRAND_PLUM};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:14px 32px;border-radius:50px;">${label}</a>`;
}

// Label/value table used by the admin alert emails (new subscriber, new inquiry).
export function detailRows(rows: [string, string][]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#2A1B38;">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="padding:6px 12px 6px 0;color:#8B7B95;white-space:nowrap;">${label}</td><td style="padding:6px 0;font-weight:600;">${value}</td></tr>`
  )
  .join('\n')}
</table>`;
}

// content = inner HTML for the body. footerNote = small print under the divider.
export function brandedEmail({
  title,
  content,
  footerNote,
}: {
  title?: string;
  content: string;
  footerNote?: string;
}): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:${BRAND_CREAM};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_CREAM};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(77,43,100,0.08);">
        <tr><td style="background:linear-gradient(135deg,${BRAND_PLUM} 0%,${BRAND_PLUM_LIGHT} 100%);padding:28px 32px 24px;">
          <div style="font-size:11px;letter-spacing:0.12em;color:rgba(255,255,255,0.45);text-transform:uppercase;margin-bottom:4px;">iRoxanne Studio</div>
          ${title ? `<div style="font-family:Georgia,'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:#fff;">${title}</div>` : `<div style="font-family:Georgia,'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:#fff;">iRoxanne Studio</div>`}
        </td></tr>
        <tr><td style="height:3px;background:linear-gradient(90deg,${BRAND_GOLD} 0%,#E8D5A0 50%,${BRAND_GOLD} 100%);"></td></tr>
        <tr><td style="padding:34px 32px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:${BRAND_PLUM_DARK};">
          ${content}
        </td></tr>
        <tr><td style="padding:0 32px;"><div style="height:1px;background:rgba(45,42,74,0.08);"></div></td></tr>
        <tr><td style="padding:18px 32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:rgba(45,42,74,0.35);text-align:center;">
          ${footerNote || ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// HTML-escape a value for safe interpolation into email HTML.
export function esc(v: unknown): string {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Resolve the studio admin notification email: BrandProfile.notify_email,
// otherwise the first admin user on the account.
export async function resolveAdminEmail(base44: any): Promise<string> {
  const brand = await base44.asServiceRole.entities.BrandProfile.list().catch(() => []);
  if (brand[0]?.notify_email) return brand[0].notify_email;
  const users = await base44.asServiceRole.entities.User.list().catch(() => []);
  const admin = users.find((u: any) => u.role === 'admin') || users[0];
  return admin?.email || '';
}