import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    if (b.action === 'public') {
      const rows = await db.Testimonial.filter({approved_for_use:true,consent_to_publish:true,featured_homepage:true}, 'sort_order', 3);
      return Response.json({items:rows.filter(t=>!t.request_pending).map(t=>({
        id:t.id, quote:t.quote, client_anonymous:t.client_anonymous,
        client_name:t.client_anonymous ? '' : t.client_name
      }))});
    }
    if (!b.id || !b.token) return Response.json({error:'Invalid feedback link.'},{status:403});
    const item = await db.Testimonial.get(b.id).catch(()=>null);
    if (!item || !item.access_token || item.access_token !== b.token || !item.expires_at || new Date(item.expires_at) < new Date())
      return Response.json({error:'This feedback link is invalid or expired. Please ask Roxanne for a new link.'},{status:403});
    if (b.action === 'get') return Response.json({submitted:!item.request_pending});
    if (b.action !== 'submit') return Response.json({error:'Unknown action.'},{status:400});
    if (!item.request_pending) return Response.json({submitted:true});
    const quote = typeof b.quote === 'string' ? b.quote.trim() : '';
    if (!quote || quote.length > 3000) return Response.json({error:'Please enter feedback of up to 3,000 characters.'},{status:400});
    const name = typeof b.client_name === 'string' ? b.client_name.trim().slice(0,120) : '';
    const consent = b.consent_to_publish === true;
    const anonymous = b.client_anonymous === true || !name;
    await db.Testimonial.update(item.id,{
      quote,client_name:name,client_anonymous:anonymous,
      consent_to_publish:consent,approved_for_use:false,featured_homepage:false,
      permission_notes:consent ? 'Client permitted website and studio marketing use through the private feedback form. Display name choice recorded with submission.' : 'Client provided private feedback only.',
      submitted_at:new Date().toISOString(),date:new Date().toISOString().slice(0,10),request_pending:false
    });
    return Response.json({submitted:true});
  } catch {
    return Response.json({error:'Feedback could not be saved. Please try again.'},{status:500});
  }
}
