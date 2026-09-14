export const INTAKE_LABELS = {
  pending: 'Link ready', sent: 'Sent', in_progress: 'In progress', submitted: 'Completed', reviewed: 'Reviewed',
};
export function intakeSteps(profile = {}) {
  profile = profile ?? {};
  const steps = ['welcome', 'idea', 'account', 'basics', 'workflow', 'brand'];
  if (profile.content === 'ready') steps.push('home', 'about');
  if (profile.features?.includes('services')) steps.push('services');
  if (profile.features?.includes('gallery')) steps.push('gallery');
  if (profile.features?.includes('testimonials')) steps.push('testimonials');
  if (profile.features?.includes('contact')) steps.push('contact');
  if (profile.connections === 'yes' || profile.start === 'existing') steps.push('data');
  if (profile.content === 'ready') steps.push('documents', 'legal');
  steps.push('notes', 'review');
  return steps;
}
export function readableIntake(value) {
  if (value == null || value === '') return '';
  if (typeof value !== 'object') return String(value);
  return Object.entries(value).map(([key, item]) => {
    const text = readableIntake(item);
    return text ? (Array.isArray(value) ? text : intakeFieldLabel(key) + ': ' + text) : '';
  }).filter(Boolean).join('\n');
}

const FIELD_LABELS = {"business_name":"Business or project name","email_for_site":"Public email address","platform_account_email":"Base44 account email","social_links":"Social media links","logo_url":"Logo","headshot_url":"Headshot","page_home":"Home page","page_about":"About page","page_services":"Services and packages","page_gallery":"Gallery","page_testimonials":"Testimonials","page_contact":"Contact page","page_legal":"Policies","documents_urls":"Uploaded documents","documents_notes":"About your documents","workflow_description":"How your app could work","user_roles":"Who will use your app","data_tracked":"Information to keep track of","automations_wanted":"What should happen automatically","journey_profile":"Your starting point and idea","start":"Where you are starting","content":"Content available","connections":"Tools to connect","features":"Content to include","idea":"Your idea","audience":"Who this would help","hero_cta_text":"Button text","photo_urls":"Photos"};
export function intakeFieldLabel(key) { return FIELD_LABELS[key] || key.replaceAll('_', ' ').replace(/^./, c => c.toUpperCase()); }
