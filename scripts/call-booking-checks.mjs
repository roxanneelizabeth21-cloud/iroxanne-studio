import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
function load(path,names='',bindings={}){
 const src=fs.readFileSync(path,'utf8').replace(/^import .*;\n/gm,'').replace(/export default /,'return ').replace(/export /g,'')+(names?'\nreturn {'+names+'};':'');
 return new Function(...Object.keys(bindings),ts.transpile(src,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}))(...Object.values(bindings));
}
const helpers=load('base44/shared/callAvailability.ts','defaultCallSettings,validateCallSettings,callSlots');
const {defaultCallSettings:defaults,callSlots,validateCallSettings}=helpers;
const settings={...defaults,enabled:true,notice_hours:1,horizon_days:7};
const now=Date.parse('2026-09-14T12:00:00Z');
let slots=callSlots(settings,[],now);
assert.equal(slots[0],'2026-09-14T14:00:00.000Z');
assert.equal(slots[1],'2026-09-14T14:45:00.000Z');
assert.ok(!slots.some(x=>new Date(x).getUTCDay()===0||new Date(x).getUTCDay()===6));
const busy=[{start:'2026-09-14T14:00:00Z',end:'2026-09-14T14:30:00Z'}];
assert.equal(callSlots(settings,busy,now)[0],'2026-09-14T14:45:00.000Z');
assert.ok(!callSlots({...settings,blocked_dates:['2026-09-14']},[],now).some(x=>x.startsWith('2026-09-14')));
assert.equal(callSlots(settings,[],Date.parse('2026-11-02T12:00:00Z'))[0],'2026-11-02T15:00:00.000Z');
assert.throws(()=>validateCallSettings({...settings,timezone:'invalid'}));
assert.throws(()=>validateCallSettings({...settings,weekly_hours:[{day:1,start:'16:00',end:'10:00'}]}));
console.log('PASS hours, breaks, busy events, blocked dates, daylight saving, settings validation');
let lead={id:'lead1',email:'test@example.test',name:'Test',booking_token:'a'.repeat(64),status:'new'};
let role='admin',mode='normal',events=new Map(),emailCount=0,inserts=0;
const s={...settings,notice_hours:1,horizon_days:21};
const entities={CallSettings:{list:async()=>[s]},Lead:{get:async()=>({...lead}),update:async(id,x)=>(lead={...lead,...x})}};
const mockFetch=async(url,opts={})=>{
 if(url.endsWith('/freeBusy'))return Response.json({calendars:{primary:mode==='busy_error'?{errors:[{reason:'notFound'}]}:{busy:[]}}});
 if(url.includes('/events?')){
  inserts++;const e=JSON.parse(opts.body);
  if(events.has(e.id))return Response.json({}, {status:409});
  events.set(e.id,{...e,id:e.id});return Response.json(e);
 }
 if(url.includes('/events/')){const e=events.get(url.split('/').pop());return Response.json(e||{}, {status:e?200:404});}
 return Response.json({summary:'Test calendar',timeZone:'America/New_York'});
};
const handler=load('base44/functions/quoteCallBooking/entry.ts','',{...helpers,fetch:mockFetch,createClientFromRequest:()=>({auth:{me:async()=>({role})},asServiceRole:{entities,connectors:{getConnection:async()=>({accessToken:'mock'})},integrations:{Core:{SendEmail:async()=>{emailCount++;}}}}}),esc:x=>String(x||''),brandedEmail:x=>x.content,brandButton:()=>'',resolveAdminEmail:async()=>'admin@example.test'});
const invoke=async b=>handler(new Request('https://example.test',{method:'POST',body:JSON.stringify({lead_id:'lead1',token:'a'.repeat(64),...b})}));
role='user';assert.equal((await invoke({action:'admin_load'})).status,403);
assert.equal((await invoke({action:'slots',token:'wrong'})).status,403);
role='admin';mode='busy_error';assert.equal((await invoke({action:'slots'})).status,500);mode='normal';
const available=await (await invoke({action:'slots'})).json();assert.ok(available.slots.length);
assert.equal((await invoke({action:'book',start:'2020-01-01',phone:'5551234567'})).status,409);
const start=available.slots[0];const booked=await invoke({action:'book',start,phone:'+1 555 123 4567'});assert.equal(booked.status,200);assert.equal((await booked.json()).booked,true);assert.equal(inserts,1);assert.equal(emailCount,2);
await invoke({action:'book',start,phone:'+1 555 123 4567'});assert.equal(inserts,1);assert.equal(emailCount,2);
console.log('PASS private links, admin guard, fail-closed calendar errors, invalid slot rejection, booking and retry');
// Simulate lost response after Google created the event but before lead bookkeeping.
lead={...lead,call_event_id:'',call_pending_start:start};
const recovered=await (await invoke({action:'slots'})).json();assert.equal(recovered.booked,true);assert.ok(lead.call_event_id);assert.equal(inserts,1);
console.log('PASS recovery of existing Google event after interrupted request');
lead={id:'lead2',email:'other@example.test',booking_token:'a'.repeat(64),status:'new'};
const conflict=await invoke({action:'book',start,phone:'5551234567'});assert.equal(conflict.status,409);assert.equal(emailCount,2);
console.log('PASS same-time Google event collision rejects second client');
console.log('4 booking test groups passed; no real calendar events or emails.');
