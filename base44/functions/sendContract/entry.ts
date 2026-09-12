import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAdmin } from '../../shared/marketingAdmin.ts';
import { esc, brandedEmail, brandButton } from '../../shared/emailBrand.ts';
export default async function(req: Request) {
  try {
    const base44=createClientFromRequest(req);
    const guard=await requireAdmin(base44); if(!guard.ok) return guard.response;
    const {contract_id}=await req.json();
    if(!contract_id) return Response.json({error:'Contract ID required'},{status:400});
    const contract=await base44.entities.Contract.get(contract_id);
    if(!['draft','sent'].includes(contract.status)) return Response.json({error:'Only draft or sent contracts may be sent for signature.'},{status:409});
    if(!contract.client_email || !contract.terms?.trim()) return Response.json({error:'Add the client email and agreement terms before sending.'},{status:400});
    const token=contract.access_token || Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
    const link='https://iroxannestudio.base44.app/contract/'+contract_id+'?t='+token;
    await base44.entities.Contract.update(contract_id,{access_token:token,status:'sent',sent_at:new Date().toISOString()});
    let sent=false;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({to:contract.client_email,subject:'Your project agreement — '+contract.project_title,
        html:brandedEmail({title:'Your agreement is ready',content:'<p>Hello '+esc(contract.client_name || 'there')+',</p><p>Review the scope, investment, and terms for <strong>'+esc(contract.project_title)+'</strong>, then sign your agreement online.</p><p>'+brandButton('Review and sign agreement',link)+'</p><p>This link is private to you.</p>'})});
      sent=true;
    } catch { /* Return the private link so the admin can retry delivery. */ }
    return Response.json({link,sent});
  } catch(e) {return Response.json({error:(e as Error).message},{status:500});}
}