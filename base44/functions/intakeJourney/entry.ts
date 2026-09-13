import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
const FIELDS = ["business_name", "tagline", "phone", "email_for_site", "address", "social_links", "brand_colors", "logo_url", "headshot_url", "design_notes", "page_home", "page_about", "page_services", "page_gallery", "page_testimonials", "page_contact", "page_legal", "documents_urls", "documents_notes", "workflow_description", "user_roles", "data_tracked", "business_rules", "existing_tools", "automations_wanted", "additional_pages", "additional_notes", "journey_profile", "journey_step"];
export default async function(req: Request) {
  try {
    const body = await req.json();
    if (!body.id || !body.token) return Response.json({error:'This link is incomplete.'},{status:403});
    const db = createClientFromRequest(req).asServiceRole.entities;
    const record = await db.ClientIntake.get(body.id).catch(()=>null);
    if (!record || record.access_token !== body.token) return Response.json({error:'This link is not available.'},{status:403});
    let result = record;
    if (body.action !== 'get') {
      if (!['save','submit'].includes(body.action)) return Response.json({error:'Unknown action'},{status:400});
      if (['submitted','reviewed'].includes(record.status)) return Response.json({error:'This intake has already been submitted.'},{status:409});
      const updates: Record<string,unknown> = {};
      for (const key of FIELDS) if (Object.hasOwn(body.answers || {},key)) updates[key]=body.answers[key];
      if (JSON.stringify(updates).length > 250000) return Response.json({error:'Please shorten your answers or share a document link.'},{status:400});
      updates.status = body.action === 'submit' ? 'submitted' : 'in_progress';
      if (body.action === 'submit') updates.submitted_at = new Date().toISOString();
      result = await db.ClientIntake.update(record.id,updates);
    }
    const publicRecord = Object.fromEntries(['id','client_name','project_title','project_tier','status',...FIELDS].map(k=>[k,result[k]]));
    return Response.json({record:publicRecord});
  } catch (_e) { return Response.json({error:'We could not save or load your intake. Please try again.'},{status:500}); }
}
