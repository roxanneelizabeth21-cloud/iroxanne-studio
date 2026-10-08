// Reusable monthly maintenance agreement. Fee, edit allowance, and hosting model are set per client.
// hosted = true: the Studio hosts the app in its own Base44 workspace (special arrangement, e.g. Dia and Sean).
// hosted = false: the client owns the Base44 account and the Studio maintains it with access the client grants.

export const MAINTENANCE_TITLE = 'APP MAINTENANCE AND HOSTING AGREEMENT';

export const MAINTENANCE_DEFAULTS = { fee: 75, minutes: 30, rate: 65, responseDays: 2, hosted: false };

const num = (v, fallback) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : fallback);

export function buildMaintenanceAgreement(opts = {}) {
  const fee = num(opts.fee, MAINTENANCE_DEFAULTS.fee);
  const minutes = num(opts.minutes, MAINTENANCE_DEFAULTS.minutes);
  const rate = num(opts.rate, MAINTENANCE_DEFAULTS.rate);
  const days = num(opts.responseDays, MAINTENANCE_DEFAULTS.responseDays);
  const hosted = opts.hosted === true;
  const client = String(opts.clientName || '').trim() || '[Client name]';
  const app = String(opts.appName || '').trim() || "the Client's application";
  const allowance = minutes % 60 === 0 ? `${minutes / 60} hour${minutes === 60 ? '' : 's'}` : `${minutes} minutes`;

  const hostingSection = hosted
    ? `3. HOSTING
The Application is hosted in the Studio's own Base44 workspace and stays there while this Agreement is active. This is a special arrangement made for the Client. The Studio's usual practice is for clients to hold their own Base44 account and receive a handoff, and this arrangement does not change that practice for other clients or create any right to it. This Agreement does not include moving the Application to an account owned by the Client. If the Client later wants that, it is a separate project that is quoted and agreed in writing.
The Client's content and data (customers, quotes, orders, photos, and business information) remain the Client's. On written request at any time, the Studio will provide that data in an exportable format.`
    : `3. ACCESS AND HOSTING
The Application is hosted in a Base44 account that the Client owns and pays for. The Client gives the Studio the access needed to maintain it. The Studio uses that access only for the work in this Agreement. The Client may remove the access at any time by written notice, and the Studio's maintenance duties end when it is removed. Platform subscription fees for the Client's account are paid by the Client.
The Client's content and data remain the Client's.`;

  const terms = `${MAINTENANCE_TITLE}

This Agreement is between iRoxanne Studio (the "Studio") and ${client} (the "Client"). It covers ${app} (the "Application"). It takes effect when the Client signs.

1. WHAT THIS AGREEMENT COVERS
For a monthly fee, the Studio will maintain the Application${hosted ? ' and host it' : ''}. Each month the fee includes:
(a) Compatibility fixes. Repairing the Application when it stops working because a third-party provider or platform changed, such as Square, Base44, or software packages.
(b) Updates. Keeping the Application's software packages and platform connections up to date so it keeps working.
(c) Minor edits. Routine content and settings changes to existing pages and features, such as text, prices, images, and listings. Up to ${allowance} per month is included, counted in 15-minute increments. Unused time does not carry over. The Studio may, at its discretion, complete very small requests without counting them.
Errors in the Studio's original work are corrected at no charge. They do not count against the minor-edit allowance and are not billed under this Agreement.

2. WHAT IS NOT COVERED
Building or creating anything that is not part of the original Application, including new pages or sections, new features, forms or integrations, and redesigns, and minor-edit time beyond the monthly allowance. Problems caused by changes the Client or others make to the Application or its settings are also not covered. These are billed at $${rate} per hour, or at a fixed price agreed in writing, and the Client approves them before work begins.

${hostingSection}

4. FEE AND BILLING
The fee is $${fee} per month. The first month is due at signing. After that, the Studio sends a Square invoice each month, due within 7 days. The Studio does not store cards or charge automatically. If an invoice is more than 14 days overdue, the Studio may pause maintenance after written notice.${hosted ? ' The Application stays online while an unpaid invoice is open, unless it is more than 30 days overdue.' : ''}

5. THIRD-PARTY COSTS
The monthly fee covers the Studio's services only. Fees charged directly by other providers are separate, including Square payment processing fees, domain registration and renewal, platform subscriptions, and any email or text-message services.

6. RESPONSE TIME
The Studio will respond to maintenance requests sent by email within ${days} business day${days === 1 ? '' : 's'}. Requests are handled in the order received. Urgent issues that stop orders or payments are handled first. Response times are a goal, not a guarantee of a fix time.

7. TERM AND CANCELLATION
This Agreement runs month to month. Either party may cancel by giving 30 days' written notice; email is enough. Fees are owed through the end of the notice period.${hosted ? " After the end date, the Studio will provide the Client's data on request and may take the Application offline." : ' After the end date, the Studio will remove its access to the Application.'}

8. THIRD-PARTY PLATFORMS
The Studio does not control the platform, payment, email, or domain providers the Application depends on. Outages, price changes, or policy changes by those providers are outside the Studio's control, and the Studio is not responsible for them. The Studio will tell the Client promptly if a change affects the Application or the fee.

9. LIABILITY
To the extent the law allows, the Studio's total liability under this Agreement is limited to the fees the Client paid in the 3 months before the claim. Neither party is liable for indirect or consequential damages, including lost sales or profits.

10. GENERAL
North Carolina law governs this Agreement. This Agreement is the whole agreement about maintenance${hosted ? ' and hosting' : ''}. It does not change any other written agreement between the parties about the original build. Changes must be in writing and agreed by both parties. The parties agree to sign electronically, and an electronic signature counts as a handwritten one.`;

  const scope_summary = `Monthly maintenance${hosted ? ' and hosting' : ''} for ${app}. Each month includes: (1) compatibility fixes when a third-party provider or platform change affects the application; (2) updates to keep software packages and platform connections current; and (3) up to ${allowance} of minor edits, which are routine content and settings changes to existing pages and features such as text, prices, images, and listings, with no rollover of unused time. Errors in the Studio's original work are corrected at no charge. Building or creating anything not part of the original application, including new pages, features, forms, integrations, and redesigns, and edit time beyond the monthly allowance, is billed at $${rate} per hour or a fixed price agreed in writing, with the Client's approval before work begins.`;

  return {
    terms,
    scope_summary,
    line_items: [{ description: `Monthly App Maintenance${hosted ? ' and Hosting' : ''} (per month, month to month)`, quantity: 1, amount: fee }],
    payment_schedule: `$${fee} per month. The first month is due at signing. After that, the Studio sends a Square invoice each month, due within 7 days. Payments are not automatically charged.`,
    deposit_amount: fee,
    deposit_percent: 100,
  };
}
