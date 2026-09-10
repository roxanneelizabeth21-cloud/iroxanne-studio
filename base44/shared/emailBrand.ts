// Shared branded HTML email shell so every email the app sends looks like iRoxanne Studio:
// plum header wordmark, warm cream body, consistent footer — aligned with the site palette.
export const BRAND_PLUM = '#4D2B64';   // primary — hsl(276 40% 28%)
export const BRAND_PLUM_LIGHT = '#7B4FA0'; // lighter plum for buttons/accents
export const BRAND_CREAM = '#FBF9F6';   // background — hsl(10 25% 98%)
export const BRAND_PLUM_DARK = '#2A1B38'; // deep plum for body text accents

export function brandButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${BRAND_PLUM};color:#FBF9F6;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:8px;">${label}</a>`;
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
        <tr><td style="background:${BRAND_PLUM};padding:30px 32px;text-align:center;">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#FBF9F6;font-weight:600;letter-spacing:0.5px;">iRoxanne Studio</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:#2A1B38;">
          ${title ? `<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:${BRAND_PLUM};">${title}</h1>` : ''}
          ${content}
        </td></tr>
        <tr><td style="padding:0 32px;"><div style="height:1px;background:#E8E0EC;"></div></td></tr>
        <tr><td style="padding:18px 32px 30px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8B7B95;text-align:center;">
          ${footerNote || ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// HTML-escape a value for safe interpolation into email HTML.
export function esc(v: unknown): string {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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