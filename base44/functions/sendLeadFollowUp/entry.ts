import { requireAuthenticated } from '../../shared/marketingAdmin.ts';
import { sendStudioEmail } from '../../shared/studioEmail.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { esc, resolveAdminEmail, brandedEmail, brandButton } from '../../shared/emailBrand.ts';
import { adminLink } from '../../shared/studioUrl.ts';

// Two-day workflow: remind Roxanne, never send the customer back through intake.
export default async function(req: Request) {
 try {
  const base44=createClientFromRequest(req),guard=await requireAuthenticated(base44);
  if(!guard.ok)return guard.response;
  const actor=await base44.auth.me().catch(()=>null);
  if(!actor||(actor.role!=='admin'&&actor.is_service!==true))return Response.json({error:'Forbidden'},{status:403});
  const body=await req.json().catch(()=>({}));
  const id=body.lead_id||body.id||body.entity_id;
  if(!id)return Response.json({error:'Missing lead_id'},{status:400});
  const db=base44.asServiceRole.entities,lead=await db.Lead.get(id).catch(()=>null);
  if(!lead||lead.is_test_record||!['new','contacted'].includes(lead.status)||lead.quote_review_reminder_state)return Response.json({skipped:true});
  const proposals=await db.Proposal.filter({lead_id:id});
  if(proposals.some((p:any)=>['sent','viewed','accepted','declined'].includes(p.status)))return Response.json({skipped:true,reason:'Proposal already delivered'});
  const admin=await resolveAdminEmail(base44);
  if(!admin)return Response.json({error:'Studio email is not configured'},{status:409});
  await db.Lead.update(id,{quote_review_reminder_state:'sending'});
  try {
   await sendStudioEmail(base44,{to:admin,subject:'Quote request needs your review — '+(lead.name||lead.email),body:brandedEmail({title:'A quote request needs attention',content:'<p>'+esc(lead.name||lead.email)+' submitted a request two days ago. Review the scope and draft, or reply with the questions you need answered.</p><p>The customer has already provided their details; no new form is needed.</p><p>'+brandButton('Review this request',adminLink(req,'proposals')+'?lead='+encodeURIComponent(id))+'</p>'})});
   await db.Lead.update(id,{quote_review_reminder_state:'sent'});
  } catch(e) { await db.Lead.update(id,{quote_review_reminder_state:'error'}); throw e; }
  return Response.json({success:true});
 } catch(e) { return Response.json({error:(e as Error).message},{status:500}); }
}