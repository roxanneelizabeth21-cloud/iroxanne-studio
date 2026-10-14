import {googleConnection} from './assistantGoogle.ts';
import {defaultCallSettings,callSlots} from './callAvailability.ts';
export async function managedCall(client:any,eventId:string) {
 if(!eventId||eventId.length>300)throw Error('Choose an intake call.');
 const call=await googleConnection(client,'googlecalendar');
 const event=await call('calendars/primary/events/'+encodeURIComponent(eventId));
 const leadId=event.extendedProperties?.private?.lead_id;
 if(!leadId||event.status==='cancelled')throw Error('Only active intake calls booked through this app can be changed here. Manage other events in Google Calendar.');
 const lead=await client.asServiceRole.entities.Lead.get(leadId);
 if(lead.call_event_id!==eventId)throw Error('The client booking has changed. Refresh the calendar.');
 return {call,event,lead};
}
export async function availableCallChanges(client:any,eventId:string) {
 const {call,event,lead}=await managedCall(client,eventId);
 const rows=await client.asServiceRole.entities.CallSettings.list('-updated_date',1),s={...defaultCallSettings,...rows[0]};
 if(!s.enabled)return {slots:[],timezone:s.timezone,event,lead};
 const now=Date.now(),end=now+s.horizon_days*86400000;
 let page='',events:any[]=[];
 do{
  const p=new URLSearchParams({singleEvents:'true',timeMin:new Date(now-s.buffer_minutes*60000).toISOString(),timeMax:new Date(end+s.buffer_minutes*60000).toISOString(),maxResults:'250',...(page?{pageToken:page}:{})});
  const r=await call('calendars/primary/events?'+p);events.push(...r.items||[]);page=r.nextPageToken||'';if(page&&events.length>=2000)throw Error('Too many calendar events to check safely. Manage this change in Google Calendar.');
 }while(page);
 const busy=events.filter(e=>e.id!==eventId&&e.status!=='cancelled'&&e.transparency!=='transparent'&&!(e.attendees||[]).some((a:any)=>a.self&&a.responseStatus==='declined')).map(e=>({start:e.start.dateTime||e.start.date,end:e.end.dateTime||e.end.date}));
 // All-day busy events are expanded by one day on each side to avoid timezone gaps.
 for(let i=0;i<busy.length;i++)if(/^\d{4}-\d{2}-\d{2}$/.test(busy[i].start)){busy[i]={start:new Date(Date.parse(busy[i].start)-86400000).toISOString(),end:new Date(Date.parse(busy[i].end)+86400000).toISOString()};}
 const duration=Math.round((Date.parse(event.end.dateTime)-Date.parse(event.start.dateTime))/60000);
 if(!Number.isFinite(duration)||duration<15||duration>120)throw Error('Review this call duration in Google Calendar.');
 return {slots:callSlots({...s,duration_minutes:duration},busy,now).filter(x=>x!==event.start.dateTime),timezone:s.timezone,event,lead,duration};
}
export async function executeCalendarChange(client:any,payload:any) {
 const {call,event,lead}=await managedCall(client,payload.event_id);
 if(event.etag!==payload.etag)throw Error('The appointment changed since this draft. Refresh and prepare a new change.');
 if(payload.operation==='cancel'){
  await call('calendars/primary/events/'+encodeURIComponent(event.id)+'?sendUpdates=all',{method:'DELETE',headers:{'If-Match':event.etag}});
  await client.asServiceRole.entities.Lead.update(lead.id,{call_event_id:'',call_start:'',call_end:'',call_pending_start:''});
  return {operation:'cancel',event_id:event.id};
 }
 if(payload.operation!=='move')throw Error('Unknown calendar change.');
 const available=await availableCallChanges(client,event.id);
 if(!available.slots.includes(payload.start))throw Error('That time is no longer available within your call hours. Prepare a new change.');
 const end=new Date(Date.parse(payload.start)+available.duration*60000).toISOString();
 await call('calendars/primary/events/'+encodeURIComponent(event.id)+'?sendUpdates=all',{method:'PATCH',headers:{'If-Match':event.etag},body:JSON.stringify({start:{dateTime:payload.start,timeZone:available.timezone},end:{dateTime:end,timeZone:available.timezone}})});
 await client.asServiceRole.entities.Lead.update(lead.id,{call_start:payload.start,call_end:end});
 return {operation:'move',event_id:event.id,start:payload.start,end};
}
