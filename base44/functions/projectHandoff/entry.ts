import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { defaultHandoff, canCompleteHandoff } from '../../shared/studioDelivery.ts';
import { clientLink } from '../../shared/studioUrl.ts';
const publicData=(c:any)=>({id:c.id,project_title:c.project_title,client_name:c.client_name,handoff_items:c.handoff_items||[],handoff_status:c.handoff_status||'draft',handoff_client_notes:c.handoff_client_notes||'',handoff_ack_name:c.handoff_ack_name,handoff_ack_at:c.handoff_ack_at});
export default async function(req: Request) {
  try {
    const base44=createClientFromRequest(req),b=await req.json();
    if(typeof b.contract_id!=='string')return Response.json({error:'Contract required'},{status:400});
    const c=await base44.asServiceRole.entities.Contract.get(b.contract_id);
    const action=b.action||'view';
    if(['view','accept','request_changes'].includes(action)) {
      if(typeof b.token!=='string'||!c.handoff_token||c.handoff_token!==b.token)return Response.json({error:'Invalid handoff link'},{status:403});
      if(c.status==='cancelled'||!['ready','accepted','changes_requested'].includes(c.handoff_status))return Response.json({error:'Handoff is not available for review.'},{status:409});
      if(action==='view')return Response.json({handoff:publicData(c)});
      if(c.handoff_status!=='ready')return Response.json({error:'This handoff already has a response.'},{status:409});
      let changes;
      if(action==='accept') {
        if(b.consent!==true||typeof b.name!=='string'||!b.name.trim())return Response.json({error:'Enter your name and confirm acceptance.'},{status:400});
        if(!canCompleteHandoff({...c,handoff_status:'accepted'}))return Response.json({error:'Required checklist items are incomplete.'},{status:409});
        changes={handoff_status:'accepted',handoff_ack_name:b.name.trim().slice(0,200),handoff_ack_at:new Date().toISOString(),handoff_ack_ip:(req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')||'unknown').slice(0,200),handoff_ack_user_agent:(req.headers.get('user-agent')||'').slice(0,1000)};
      }else{
        if(typeof b.notes!=='string'||!b.notes.trim())return Response.json({error:'Describe what needs attention.'},{status:400});
        changes={handoff_status:'changes_requested',handoff_client_notes:b.notes.trim().slice(0,3000)};
      }
      const updated=await base44.asServiceRole.entities.Contract.update(c.id,changes);
      return Response.json({handoff:publicData(updated)});
    }
    const user=await base44.auth.me().catch(()=>null);
    if(user?.role!=='admin')return Response.json({error:'Admin only'},{status:403});
    if(c.status==='cancelled')return Response.json({error:'Cancelled project'},{status:409});
    const db=base44.entities.Contract;
    if(action==='load')return Response.json({contract:{...c,handoff_items:c.handoff_items?.length?c.handoff_items:defaultHandoff()}});
    if(action==='save') {
      if(c.handoff_status==='accepted'||c.status==='completed')return Response.json({error:'Reopen the handoff before changing accepted items.'},{status:409});
      if(!Array.isArray(b.items)||!b.items.length||b.items.length>50)return Response.json({error:'Add between 1 and 50 checklist items.'},{status:400});
      const ids=new Set();
      const items=b.items.map((x:any)=>{
        if(typeof x.id!=='string'||ids.has(x.id)||!String(x.label||'').trim())throw new Error('Each checklist item needs a unique ID and label.');
        ids.add(x.id);
        return {id:x.id.slice(0,100),category:String(x.category||'Other').slice(0,80),label:String(x.label).slice(0,300),required:x.required!==false,completed:x.completed===true,completed_at:x.completed===true?(c.handoff_items||[]).find((p:any)=>p.id===x.id&&p.completed)?.completed_at||new Date().toISOString():'',notes:String(x.notes||'').slice(0,2000)};
      });
      const updated=await db.update(c.id,{handoff_items:items,handoff_status:'draft',handoff_internal_notes:String(b.internal_notes||'').slice(0,5000)});
      return Response.json({contract:updated});
    }
    if(action==='publish') {
      if(!['signed','deposit_paid','active'].includes(c.status))return Response.json({error:'The agreement must be signed first.'},{status:409});
      if(!canCompleteHandoff({...c,handoff_status:'accepted'}))return Response.json({error:'Complete the required checklist items before sharing.'},{status:400});
      if(c.handoff_status==='accepted')return Response.json({error:'Already accepted. Reopen to revise.'},{status:409});
      const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
      const updated=await db.update(c.id,{handoff_token:token,handoff_status:'ready',handoff_ack_name:'',handoff_ack_at:null,handoff_client_notes:''});
      return Response.json({contract:updated,link:clientLink(req,'handoff',c.id,token)});
    }
    if(action==='complete') {
      if(!canCompleteHandoff(c))return Response.json({error:'Complete required items and obtain client acceptance before marking delivered.'},{status:409});
      if(!['signed','deposit_paid','active'].includes(c.status))return Response.json({error:'Project cannot be marked delivered in its current state.'},{status:409});
      return Response.json({contract:await db.update(c.id,{status:'completed',delivered_at:new Date().toISOString()})});
    }
    if(action==='reopen')return Response.json({contract:await db.update(c.id,{handoff_status:'draft',handoff_token:'',handoff_ack_name:'',handoff_ack_at:null,...(c.status==='completed'?{status:'active',delivered_at:null}:{})})});
    return Response.json({error:'Unknown action'},{status:400});
  }catch(e){return Response.json({error:(e as Error).message},{status:500});}
}
