import {googleConnection} from './assistantGoogle.ts';
import {defaultCallSettings,callSlots} from './callAvailability.ts';
export function calendarInstant(value:string,zone:string) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const desired=Date.parse(value+'T00:00:00Z');let result=desired;
 const formatter=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 for(let i=0;i<3;i++){const p=Object.fromEntries(formatter.formatToParts(result).map(x=>[x.type,x.value]));const local=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),Number(p.second));result+=desired-local;}
 return new Date(result).toISOString();
}
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
  const r=await call('calendars/primary/events?'+p);events.push(...(r.items||[]).map((e:any)=>({...e,calendar_timezone:r.timeZone||s.timezone})));page=r.nextPageToken||'';if(page&&events.length>=2000)throw Error('Too many calendar events to check safely. Manage this change in Google Calendar.');
 }while(page);
 const busy=events.filter(e=>e.id!==eventId&&e.status!=='cancelled'&&e.transparency!=='transparent'&&!(e.attendees||[]).some((a:any)=>a.self&&a.responseStatus==='declined')).map(e=>({start:calendarInstant(e.start.dateTime||e.start.date,e.start.timeZone||e.calendar_timezone),end:calendarInstant(e.end.dateTime||e.end.date,e.end.timeZone||e.calendar_timezone)}));
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
