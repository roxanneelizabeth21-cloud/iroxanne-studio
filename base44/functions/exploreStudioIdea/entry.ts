import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const text = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

function buildDeterministicConcept(ideaRaw: string, kindRaw: string) {
  const lower = `${ideaRaw} ${kindRaw}`.toLowerCase();
  if (/salon|hair|beauty|barber|spa/.test(lower)) {
    return {
      title: 'Client Booking & Care Studio',
      summary: 'A calm booking and client care space where appointments, service notes, and follow-ups stay in one place.',
      question: 'What would you like to make easier first?',
      choices: ['Fewer missed appointments', 'Keep client notes together', 'Let clients book online'],
      features: ['Online service booking', 'Client history & notes', 'Automated reminders', 'Service menu & pricing'],
    };
  }
  if (/real estate|property|realtor|listing|home/.test(lower)) {
    return {
      title: 'Property Showcase & Inquiry Hub',
      summary: 'A clean property showcase where buyers can explore listings, request tours, and stay in touch.',
      question: 'What would make the biggest difference first?',
      choices: ['Showcase active listings', 'Track buyer & seller inquiries', 'Schedule property tours'],
      features: ['Interactive listing gallery', 'Tour request scheduling', 'Lead & inquiry tracker', 'Neighborhood highlights'],
    };
  }
  if (/landscap|lawn|garden|outdoor|crew/.test(lower)) {
    return {
      title: 'Outdoor Project & Crew Planner',
      summary: 'A simple way to collect estimate requests, organize seasonal visits, and showcase finished outdoor work.',
      question: 'What takes up too much time right now?',
      choices: ['Collecting project requests', 'Scheduling crews & visits', 'Sharing project photos'],
      features: ['Quote & request intake', 'Visit & crew schedule', 'Before-and-after gallery', 'Client status updates'],
    };
  }
  if (/shop|store|product|retail|sell|order|inventory/.test(lower)) {
    return {
      title: 'Custom Storefront & Order Hub',
      summary: 'A tailored storefront that brings your products, customer orders, and inventory updates together.',
      question: 'What would you like to simplify first?',
      choices: ['Taking customer orders', 'Tracking stock & fulfillment', 'Showcasing featured items'],
      features: ['Product catalog & checkout', 'Order status tracking', 'Inventory overview', 'Customer update emails'],
    };
  }
  if (/community|reading|reflection|devotional|church|member|group|learn/.test(lower)) {
    return {
      title: 'Community & Daily Resource Hub',
      summary: 'A welcoming gathering place to share daily readings, resources, and community updates.',
      question: 'What matters most for your community first?',
      choices: ['Sharing daily or weekly posts', 'Organizing events & gatherings', 'Giving members a shared space'],
      features: ['Featured resource library', 'Community discussion board', 'Event & gathering calendar', 'Member updates'],
    };
  }
  if (/family|household|meal|travel|trip|personal|routine/.test(lower)) {
    return {
      title: 'Everyday Planning Workspace',
      summary: 'A calm personal workspace to keep schedules, routines, and shared plans organized in one spot.',
      question: 'What would you love to get out of your head first?',
      choices: ['Weekly plans & routines', 'Shared family schedules', 'Lists, notes, and reminders'],
      features: ['Weekly planner board', 'Shared checklists', 'Important dates & reminders', 'Quick notes & ideas'],
    };
  }
  return {
    title: 'Custom Business & Client Hub',
    summary: 'A tailored website and workspace designed around how you work with your clients every day.',
    question: 'What would you like to make easier first?',
    choices: ['Let customers book or inquire', 'Keep client work in one place', 'Replace scattered spreadsheets'],
    features: ['Client inquiry & booking flow', 'Project & task dashboard', 'Automated client updates', 'Simple admin controls'],
  };
}

// Public concept helper: uses zero-credit deterministic studio templates for anonymous
// visitors so unauthenticated callers can never spend paid AI credits.
export default async function (req: Request): Promise<Response> {
  if (req.method !== 'POST') return Response.json({ fallback: true }, { status: 405 });
  try {
    const raw = await req.text();
    if (raw.length > 2000) return Response.json({ fallback: true });
    const body = JSON.parse(raw);
    if (!text(body.idea, 1200) || body.idea.trim().length < 8 || !text(body.kind, 100)) {
      return Response.json({ fallback: true });
    }
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ concept: buildDeterministicConcept(body.idea, body.kind) });
    }
    return Response.json({ concept: buildDeterministicConcept(body.idea, body.kind) });
  } catch {
    return Response.json({ fallback: true });
  }
}