// Lightweight project estimator for the Get-a-Quote intake.
// Produces a tier label and an hour / price range from the selected
// features, integrations, and compliance needs. Intentionally simple —
// it gives the studio a ballpark to frame the follow-up proposal, not a quote.

const RATE = 65; // blended $/hr

const INTEGRATION_HOURS = {
  'Payments (Stripe/Square)': 12,
  'Gmail / Google Calendar': 8,
  'Zapier': 6,
  'Email marketing (SendGrid/Mailchimp)': 8,
  'SMS (Twilio)': 8,
  'QuickBooks': 10,
  'Other third-party API': 8,
  'None yet': 0,
};

export function estimateProject({ mustHave = [], niceToHave = [], integrations = [], compliance = '' } = {}) {
  let hoursLow = 40;
  let hoursHigh = 60;

  // Features
  hoursLow += mustHave.length * 8;
  hoursHigh += mustHave.length * 12;
  hoursLow += niceToHave.length * 4;
  hoursHigh += niceToHave.length * 6;

  // Integrations
  integrations.forEach((name) => {
    const h = INTEGRATION_HOURS[name] ?? 8;
    hoursLow += Math.round(h * 0.7);
    hoursHigh += h;
  });

  // Compliance overhead
  if (/hipaa|gdpr|pci/i.test(compliance || '')) {
    hoursLow += 16;
    hoursHigh += 24;
  }

  hoursLow = Math.round(hoursLow);
  hoursHigh = Math.round(hoursHigh);

  const priceLow = Math.round((hoursLow * RATE) / 100) * 100;
  const priceHigh = Math.round((hoursHigh * RATE) / 100) * 100;

  let tier = 'small';
  if (hoursHigh > 240) tier = 'enterprise';
  else if (hoursHigh > 120) tier = 'standard';

  return { tier, hoursLow, hoursHigh, priceLow, priceHigh };
}