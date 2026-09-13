export const INTAKE_LABELS = {
  pending: 'Link ready', sent: 'Sent', in_progress: 'In progress', submitted: 'Completed', reviewed: 'Reviewed',
};
export function intakeSteps(profile = {}) {
  const steps = ['welcome', 'idea', 'workflow', 'brand'];
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
    return text ? (Array.isArray(value) ? text : key.replaceAll('_', ' ') + ': ' + text) : '';
  }).filter(Boolean).join('\n');
}
