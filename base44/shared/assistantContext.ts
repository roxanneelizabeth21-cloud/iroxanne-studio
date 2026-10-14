import {paymentSummary} from './paymentSummary.ts';
import {readInbox,readCalendar,STUDIO_EMAIL,emailValid} from './assistantGoogle.ts';
const cut=(v:any,n=6000)=>typeof v==='string'?v.slice(0,n):v;
const fields=(row:any,keys:string[])=>Object.fromEntries(keys.filter(k=>row[k]!=null).map(k=>[k,cut(row[k])]));
const SPECS:any={
 Lead:['id','name','email','business_name','business_type','quick_pitch','problem_to_solve','selected_package','must_have_features','nice_to_have_features','integrations_needed','existing_tools','ideal_launch_date','draft_estimate_status','status','created_date','updated_date','call_event_id','call_start','draft_proposal_id','quote_confirmation_email_state'],
 Proposal:['id','lead_id','client_name','client_email','project_title','scope_summary','deliverables','price_total','requires_scope_review','status','created_date','updated_date','sent_at','accepted_at','change_request','changes_requested_at'],
 Contract:['id','lead_id','client_name','client_email','project_title','scope_summary','line_items','price_total','status','target_launch_date','signed_at','created_date','updated_date','handoff_status','handoff_items','handoff_client_notes'],
 ClientIntake:['id','lead_id','contract_id','client_name','client_email','project_title','status','requests','request_note','admin_notes','additional_notes','created_date','updated_date','submitted_at','sent_at'],
 Invoice:['id','contract_id','client_name','client_email','project_title','status','amount_total','deposit_amount','due_date','last_sent_at','reminder_enabled','reminder_next_at','square_schedule_enabled','square_invoice_id','square_last_checked_at','created_date','updated_date'],
 ContactMessage:['id','name','email','subject','message','created_date','updated_date','inquiry_type'],
 PortfolioItem:['id','title','description','tagline','category','client_shareable'],
};
const ROUTES:any={Lead:'/admin/proposals',Proposal:'/admin/proposals',Contract:'/admin/contracts',ClientIntake:'/admin/projects',Invoice:'/admin/invoices',ContactMessage:'/admin/messages',PortfolioItem:'/admin/portfolio'};
export async function assistantContext(client:any,focus='') {
 if(focus&&!emailValid(focus))throw Error('Choose a valid client.');
 const db=client.asServiceRole.entities,warnings:string[]=[];const raw:any={};
 await Promise.all([...Object.keys(SPECS),'Payment','StudioAssistantItem','StudioAssistantMessage','CallSettings','BrandProfile'].map(async name=>{
  try{raw[name]=await db[name].list('-created_date',name==='StudioAssistantMessage'?30:name==='BrandProfile'||name==='CallSettings'?1:500);if(raw[name].length>=500)warnings.push(name+' has more history than this view covers (latest 500 records).');}
  catch{raw[name]=[];warnings.push(name+' could not be loaded. Its information may be missing.');}
 }));
 for(const key of ['Lead','ClientIntake'])raw[key]=raw[key].filter((r:any)=>!r.is_test_record);
 const invoices=raw.Invoice.map((r:any)=>({...fields(r,SPECS.Invoice),...paymentSummary(r,raw.Payment.filter((p:any)=>p.invoice_id===r.id))}));
 const sources:any[]=[];const clients=new Map();
 const collect=(email:string,name:string)=>{email=String(email||'').trim().toLowerCase();if(emailValid(email)&&email!==STUDIO_EMAIL&&!clients.has(email))clients.set(email,{email,name:name||email});};
 for(const [kind,keys]of Object.entries(SPECS))for(const row of raw[kind]) {
  const r=fields(row,keys as string[]),email=String(r.client_email||r.email||'').trim().toLowerCase();
  if(kind==='PortfolioItem'&&!row.client_shareable)continue;
  collect(email,r.client_name||r.name||r.business_name);
  if(focus&&email!==focus&&kind!=='PortfolioItem')continue;
  const value=kind==='Invoice'?invoices.find((i:any)=>i.id===r.id):r;
  const title=r.project_title||r.business_name||r.subject||r.title||r.name||r.client_name||kind;
  sources.push({id:kind+':'+r.id,kind,title,email,date:r.updated_date||r.created_date||'',url:ROUTES[kind]+(kind==='Lead'?'?lead='+encodeURIComponent(r.id):''),data:value});
 }
 const results=await Promise.allSettled([readInbox(client,focus),readCalendar(client)]);
 const inbox:any=results[0].status==='fulfilled'?results[0].value:{connected:false,threads:[],coverage:'Email unavailable',error:results[0].reason.message};
 const calendar:any=results[1].status==='fulfilled'?results[1].value:{connected:false,events:[],coverage:'Calendar unavailable',error:results[1].reason.message};
 if(inbox.error)warnings.push(inbox.error);if(calendar.error)warnings.push(calendar.error);
 if(inbox.failed)warnings.push(inbox.failed+' email threads could not be read.');
 if(inbox.limited)warnings.push('More email history exists than the 20 threads shown. Open Gmail for the complete history.');
 if(calendar.limited)warnings.push('More than 100 calendar events exist in this window. Open Google Calendar for the full schedule.');
 for(const t of inbox.threads){const peer=[...t.messages].reverse().find((m:any)=>m.from_email!==STUDIO_EMAIL)?.from_email||focus; sources.push({id:'Email:'+t.id,kind:'Email',title:t.subject,email:peer||'',date:t.date,url:t.url,data:t});}
 for(const e of calendar.events){const lead=raw.Lead.find((l:any)=>l.id===e.lead_id);const email=lead?.email||(e.attendees||[]).find((a:any)=>clients.has(a))||'';if(focus&&email!==focus)continue;sources.push({id:'Calendar:'+e.id,kind:'Calendar',title:e.title,email,date:e.start,url:e.url,data:e});}
 collect(focus,focus);
 const items=raw.StudioAssistantItem.filter((i:any)=>!focus||i.client_email===focus);
 for(const i of items.filter((i:any)=>['note','task','scope_change'].includes(i.kind)&&!['dismissed'].includes(i.status)))sources.push({id:'Assistant:'+i.id,kind:i.kind==='note'?'Note':'Task',title:i.title,email:i.client_email||'',date:i.updated_date||i.created_date,url:'/admin/assistant',data:fields(i,['id','kind','title','body','status','due_date','minutes'])});
 const since=Date.now()-7*86400000,inWeek=(d:any)=>Date.parse(d||'')>=since;
 const metrics={new_inquiries:raw.Lead.filter((l:any)=>inWeek(l.created_date)).length,accepted_proposals:raw.Proposal.filter((p:any)=>inWeek(p.accepted_at)).length,recorded_payments:Math.round(raw.Payment.filter((p:any)=>inWeek(p.paid_at||p.created_date)).reduce((n:number,p:any)=>n+(Number(p.amount)||0),0)*100)/100,outstanding:Math.round(invoices.filter((i:any)=>!['cancelled','draft'].includes(i.status)).reduce((n:number,i:any)=>n+i.outstanding,0)*100)/100,period:'Past 7 days; payments recorded in the Studio ledger. Square-only receipts may not be included. Outstanding uses the latest stored payment records.'};
 const attention:any[]=[];
 for(const s of sources){const d=s.data;if(s.kind==='Lead'&&['new','contacted'].includes(d.status))attention.push({source:s.id,title:'Review inquiry: '+s.title,reason:d.draft_estimate_status==='needs_clarification'?'Scope needs clarification':'Prepare or review the quote',url:s.url});
 if(s.kind==='Proposal'&&d.status==='draft')attention.push({source:s.id,title:'Review proposal: '+s.title,reason:'Your approval is needed before sending',url:s.url});
 if(s.kind==='Contract'&&d.status==='sent')attention.push({source:s.id,title:'Awaiting signature: '+s.title,reason:'Check the agreement and recent conversation before following up',url:s.url});
 if(s.kind==='ClientIntake'&&['sent','in_progress'].includes(d.status))attention.push({source:s.id,title:'Waiting for content: '+s.title,reason:'Check the client’s checklist before asking again',url:s.url});
 if(s.kind==='Invoice'&&d.outstanding>0&&!['draft','cancelled','paid'].includes(d.status))attention.push({source:s.id,title:'Payment outstanding: '+s.title,reason:d.square_schedule_enabled||d.square_invoice_id?'Square manages reminders':d.reminder_enabled?'Studio reminders already enabled':'Review due date and recent payments before following up',url:s.url});
 if(s.kind==='Contract'&&['signed','deposit_paid','active'].includes(d.status)&&Date.now()-Date.parse(d.updated_date||d.created_date)>7*86400000)attention.push({source:s.id,title:'Check progress: '+s.title,reason:'No agreement-record update in over a week; this does not prove work has stopped',url:s.url});
 if(s.kind==='Contract'&&d.target_launch_date&&!['completed','cancelled'].includes(d.status))attention.push({source:s.id,title:'Target date: '+s.title,reason:d.target_launch_date+' — confirm progress and dependencies',url:s.url});}
 return {refreshed_at:new Date().toISOString(),account:STUDIO_EMAIL,focus,clients:[...clients.values()].sort((a,b)=>a.name.localeCompare(b.name)),sources,items,history:raw.StudioAssistantMessage.filter((m:any)=>!m.archived&&String(m.client_email||'')===focus).slice(0,10).reverse(),attention,metrics,inbox,calendar,call_settings:raw.CallSettings[0]||{},brand:fields(raw.BrandProfile[0]||{},['voice_description','service_description','audience_description','writing_rules','banned_words_phrases']),warnings};
}
export function modelContext(context:any) {
 // Explicitly projected records exclude signatures, tokens and account credentials.
 return {now:context.refreshed_at,local_date:new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(context.refreshed_at)),weekday:new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'long'}).format(new Date(context.refreshed_at)),time_zone:'America/New_York',focus:context.focus,metrics:context.metrics,attention:context.attention,coverage:[context.inbox.coverage,context.calendar.coverage,...context.warnings],sources:context.sources.slice(0,180),brand:context.brand,call_hours:context.call_settings.weekly_hours};
}
