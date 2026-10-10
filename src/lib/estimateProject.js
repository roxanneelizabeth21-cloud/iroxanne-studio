// Lightweight project estimator for the Get-a-Quote intake.
// Estimates hours from the selected features and integrations, then
// prices the request at the matching app package so the estimate agrees
// with published pricing. Gives the studio a ballpark for the follow-up
// proposal, not a binding quote.

const DEFAULT_RATE = 90; // $/hr — overridden by PricingSettings when available
const DEFAULT_PRICES = { business: 2950, custom: 4950 }; // overridden by PricingSettings packages

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

function packagePrices(packages) {
  const find = (name) => (packages || []).find((p) => String(p?.name || '').trim().toLowerCase() === name)?.price;
  return {
    business: Number(find('business')) || DEFAULT_PRICES.business,
    custom: Number(find('custom')) || DEFAULT_PRICES.custom,
  };
}

// Business covers up to (Business price / rate) hours and Custom up to
// (Custom price / rate) hours. Larger scopes are priced at the hourly
// rate, rounded up to the nearest $50.
function priceForHours(hours, rate, prices) {
  if (hours <= prices.business / rate) return { tier: 'business', price: prices.business };
  if (hours <= prices.custom / rate) return { tier: 'custom', price: prices.custom };
  return { tier: 'custom', price: Math.ceil((hours * rate) / 50) * 50 };
}

/**
 * @param {Object}  opts
 * @param {Array}   opts.mustHave     - must-have feature labels
 * @param {Array}   opts.niceToHave   - nice-to-have feature labels
 * @param {Array}   opts.integrations - integration labels
 * @param {number}  [opts.rate]       - $/hr from PricingSettings (falls back to DEFAULT_RATE)
 * @param {Array}   [opts.packages]   - PricingSettings packages (Business / Custom prices)
 */
export function estimateProject({ mustHave = [], niceToHave = [], integrations = [], rate, packages } = {}) {
  const hourlyRate = rate && rate > 0 ? rate : DEFAULT_RATE;
  const prices = packagePrices(packages);

  // Base: a simple business app built around one core workflow
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

  const low = priceForHours(hoursLow, hourlyRate, prices);
  const high = priceForHours(hoursHigh, hourlyRate, prices);

  return { tier: high.tier, hoursLow, hoursHigh, priceLow: low.price, priceHigh: high.price };
}
