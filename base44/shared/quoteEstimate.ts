// Lightweight project estimator for the Get-a-Quote intake.
// Produces a tier label and an hour / price range from the selected
// features and integrations. Gives the studio a ballpark to frame
// the follow-up proposal, not a binding quote.

const DEFAULT_RATE = 65; // blended $/hr — overridden by PricingSettings when available

const INTEGRATION_HOURS = {
  'Payments (Square/Wix)': 5,
  'Gmail / Google Calendar': 3,
  'Zapier': 2,
  'Email marketing (SendGrid/Mailchimp)': 4,
  'SMS (Twilio)': 4,
  'AI features (assistant, generator, insights)': 8,
  'Other third-party API': 5,
  'None yet': 0,
};

/**
 * @param {Object}  opts
 * @param {Array}   opts.mustHave     - must-have feature labels
 * @param {Array}   opts.niceToHave   - nice-to-have feature labels
 * @param {Array}   opts.integrations - integration labels
 * @param {number}  [opts.rate]       - $/hr from PricingSettings (falls back to DEFAULT_RATE)
 */
export function estimateProject({ mustHave = [], niceToHave = [], integrations = [], rate } = {}) {
  const hourlyRate = rate && rate > 0 ? rate : DEFAULT_RATE;

  // Base: a simple site with landing + contact + gallery
  let hoursLow = 15;
  let hoursHigh = 25;

  // Features — smaller increments matching real Base44 build times
  hoursLow += mustHave.length * 3;
  hoursHigh += mustHave.length * 5;
  hoursLow += niceToHave.length * 2;
  hoursHigh += niceToHave.length * 3;

  // Integrations
  integrations.forEach((name) => {
    const h = INTEGRATION_HOURS[name] ?? 4;
    hoursLow += Math.round(h * 0.7);
    hoursHigh += h;
  });

  hoursLow = Math.round(hoursLow);
  hoursHigh = Math.round(hoursHigh);

  const priceLow = Math.round((hoursLow * hourlyRate) / 100) * 100;
  const priceHigh = Math.round((hoursHigh * hourlyRate) / 100) * 100;

  let tier = 'starter';
  if (hoursHigh > 80) tier = 'custom';
  else if (hoursHigh > 40) tier = 'business';

  return { tier, hoursLow, hoursHigh, priceLow, priceHigh };
}