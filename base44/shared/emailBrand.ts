// Shared branded HTML email shell so every email the app sends looks like iRoxanne Studio:
// dark header wordmark, gold accents, warm off-white body, consistent footer.
export const BRAND_GOLD = '#C5A059';
export const BRAND_DARK = '#0D0D0D';

export function brandButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${BRAND_GOLD};color:#0D0D0D;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:8px;">${label}</a>`;
}

// Label/value table used by the admin alert emails (new subscriber, new inquiry).
export function detailRows(rows: [string, string][]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#1D2A2B;">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="padding:6px 12px 6px 0;color:#8B8B85;white-space:nowrap;">${label}</td><td style="padding:6px 0;font-weight:600;">${value}</td></tr>`
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
<html><body style="margin:0;padding:0;background:#F7F5F0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F0;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <tr><td style="background:${BRAND_DARK};padding:30px 32px;text-align:center;">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:26px;color:${BRAND_GOLD};font-weight:600;letter-spacing:0.5px;">iRoxanne Studio</div>
        </td></tr>
        <tr><td style="padding:34px 32px 28px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:#1D2A2B;">
          ${title ? `<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:normal;color:#12201F;">${title}</h1>` : ''}
          ${content}
        </td></tr>
        <tr><td style="padding:0 32px;"><div style="height:1px;background:#EAE5DC;"></div></td></tr>
        <tr><td style="padding:18px 32px 30px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8B8B85;text-align:center;">
          ${footerNote || ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}