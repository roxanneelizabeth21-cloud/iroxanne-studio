import {createClientFromRequest} from 'npm:@base44/sdk@0.8.44';
import {defaultCallSettings,validateCallSettings,callSlots} from '../../shared/callAvailability.ts';
import {esc,brandedEmail,brandButton,resolveAdminEmail} from '../../shared/emailBrand.ts';
const ORIGIN='https://iroxannestudio.base44.app';
async function google(token:string,path:string,options:any={}){
 const r=await fetch('https://www.googleapis.com/calendar/v3/'+path,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}});
 const data=await r.json().catch(()=>({}));
 if(!r.ok){const e:any=new Error('Google Calendar is unavailable. Please try again or contact the studio.');e.status=r.status;throw e;}return data;
}
async function eventId(start:string){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('iroxanne-call:'+start));
 return 'call'+Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
}
export default async function(req:Request){
 try{
 const b=await req.json().catch(()=>({})),client=createClientFromRequest(req),db=client.asServiceRole.entities;
 const rows=await db.CallSettings.list('-updated_date',1),s={...defaultCallSettings,...rows[0]};
 if(['admin_load','admin_save','admin_check'].includes(b.action)){
  const user=await client.auth.me().catch(()=>null);if(user?.role!=='admin')return Response.json({error:'Admin only'},{status:403});
  if(b.action==='admin_load')return Response.json({settings:s});
  if(b.action==='admin_check'){
   const {accessToken}=await client.asServiceRole.connectors.getConnection('googlecalendar');
   const c=await google(accessToken,'calendars/primary');
   return Response.json({connected:true,calendar_name:c.summary,timezone:c.timeZone});
  }
  const clean=validateCallSettings({enabled:b.settings?.enabled===true,timezone:String(b.settings?.timezone||''),duration_minutes:Number(b.settings?.duration_minutes),buffer_minutes:Number(b.settings?.buffer_minutes),notice_hours:Number(b.settings?.notice_hours),horizon_days:Number(b.settings?.horizon_days),weekly_hours:b.settings?.weekly_hours,blocked_dates:b.settings?.blocked_dates});
  if(clean.enabled){const {accessToken}=await client.asServiceRole.connectors.getConnection('googlecalendar');await google(accessToken,'calendars/primary');}
  const saved=rows[0]?await db.CallSettings.update(rows[0].id,clean):await db.CallSettings.create(clean);
  return Response.json({settings:saved});
 }
 if(b.action==='config')return Response.json({enabled:!!s.enabled});
 if(!['slots','book'].includes(b.action))return Response.json({error:'Unknown action'},{status:400});
 if(typeof b.lead_id!=='string'||typeof b.token!=='string'||b.token.length<32)return Response.json({error:'Use the private link from your quote confirmation.'},{status:403});
 let lead;try{lead=await db.Lead.get(b.lead_id);}catch{return Response.json({error:'Quote not found'},{status:404});}
 if(!lead.booking_token||lead.booking_token!==b.token)return Response.json({error:'Invalid booking link'},{status:403});
 if(lead.call_event_id)return Response.json({booked:true,start:lead.call_start,end:lead.call_end,timezone:s.timezone});
 if(!s.enabled)return Response.json({enabled:false,slots:[]});
 if(['lost','archived'].includes(lead.status))return Response.json({error:'Please contact the studio to arrange a call.'},{status:409});
 const {accessToken}=await client.asServiceRole.connectors.getConnection('googlecalendar');
 if(!accessToken)throw Error('Calendar connection required.');
 // Recover an event after a previous response or database update was lost.
 if(lead.call_pending_start){
  const pendingId=await eventId(lead.call_pending_start);
  try{
   const previous=await google(accessToken,'calendars/primary/events/'+pendingId);
   if(previous.status!=='cancelled'&&previous.extendedProperties?.private?.lead_id===lead.id){
    await db.Lead.update(lead.id,{call_event_id:previous.id,call_start:previous.start.dateTime,call_end:previous.end.dateTime,call_pending_start:''});
    return Response.json({booked:true,start:previous.start.dateTime,end:previous.end.dateTime,timezone:s.timezone});
   }
  }catch(e){if(![404,410].includes((e as any).status))throw e;}
 }
 const now=Date.now();
 const free=await google(accessToken,'freeBusy',{method:'POST',body:JSON.stringify({timeMin:new Date(now).toISOString(),timeMax:new Date(now+s.horizon_days*86400000).toISOString(),items:[{id:'primary'}]})});
 const calendar=free.calendars?.primary;if(!calendar||calendar.errors?.length||!Array.isArray(calendar.busy))throw Error('Could not check calendar availability. Please try again later.');
 const slots=callSlots(s,calendar.busy,now);
 if(b.action==='slots')return Response.json({enabled:true,slots,timezone:s.timezone,duration:s.duration_minutes});
 if(typeof b.start!=='string'||!slots.includes(b.start))return Response.json({error:'That time is no longer available. Please choose another.'},{status:409});
 const phone=String(b.phone||lead.phone||'').trim().slice(0,80);
 if(phone.length<5)return Response.json({error:'Enter the phone number you would like Roxanne to call.'},{status:400});
 const end=new Date(Date.parse(b.start)+s.duration_minutes*60000).toISOString(),id=await eventId(b.start);
 await db.Lead.update(lead.id,{call_pending_start:b.start});
 const validEmail=typeof lead.email==='string'&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lead.email);
 const attendees=validEmail?[{email:lead.email}]:[];
 let event;
 try{event=await google(accessToken,'calendars/primary/events'+(attendees.length?'?sendUpdates=all':''),{method:'POST',body:JSON.stringify({
  id,summary:'iRoxanne Studio — discovery call',description:'Phone call with '+String(lead.name||'client').slice(0,200)+' at '+phone+'.\nQuote: '+String(lead.business_name||'').slice(0,200),
  start:{dateTime:b.start,timeZone:s.timezone},end:{dateTime:end,timeZone:s.timezone},attendees,transparency:'opaque',extendedProperties:{private:{lead_id:lead.id}},reminders:{useDefault:true}
 })});}catch(e){
  if((e as any).status!==409)throw e;
  event=await google(accessToken,'calendars/primary/events/'+id);
  if(event.status==='cancelled'||event.extendedProperties?.private?.lead_id!==lead.id)return Response.json({error:'That time has just been reserved. Please choose another.'},{status:409});
 }
 await db.Lead.update(lead.id,{call_event_id:event.id,call_start:b.start,call_end:end,call_pending_start:'',phone});
 const when=new Date(b.start).toLocaleString('en-US',{timeZone:s.timezone,dateStyle:'full',timeStyle:'short'})+' ('+s.timezone+')';
 const admin=await resolveAdminEmail(client).catch(()=>'');
 const results=await Promise.allSettled([...new Set([validEmail?lead.email:null,admin].filter(Boolean))].map(to=>client.asServiceRole.integrations.Core.SendEmail({to,subject:'Call confirmed — iRoxanne Studio',html:brandedEmail({title:'Your call is confirmed',content:'<p>A '+s.duration_minutes+'-minute phone call is booked for <strong>'+esc(when)+'</strong>.</p><p>Roxanne will call '+esc(phone)+'.</p><p>To change or cancel, contact '+esc(admin||'the studio')+'.</p><p>'+brandButton('View booking',ORIGIN+'/book-call?lead='+encodeURIComponent(lead.id)+'&t='+encodeURIComponent(lead.booking_token))+'</p>'})})));
 return Response.json({booked:true,start:b.start,end,timezone:s.timezone,email_sent:results.every(x=>x.status==='fulfilled')});
 }catch(e){return Response.json({error:(e as Error).message},{status:500});}
}