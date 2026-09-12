import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(file,bindings={},exports=''){
 const source=fs.readFileSync(file,'utf8').replace(/^import .*;\n/gm,'').replace(/export default /,'return ').replace(/export (function|const) /g,'$1 ')+(exports?'\nreturn {'+exports+'};':'');
 return new Function(...Object.keys(bindings),ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}))(...Object.values(bindings));
}
const helpers=load('base44/shared/studioDelivery.ts',{},'isRushDate,defaultHandoff,validateSignature,canCompleteHandoff,reminderDecision');
const {paymentSummary}=load('base44/shared/paymentSummary.ts',{},'paymentSummary');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jL1sAAAAASUVORK5CYII=';
let checks=0;
function check(label,fn){fn();checks++;console.log('PASS '+label);}
check('rush calendar boundaries',()=>{const d=new Date(2026,8,12,12);assert.equal(helpers.isRushDate('2026-09-11',d),false);assert.equal(helpers.isRushDate('2026-10-11',d),true);assert.equal(helpers.isRushDate('2026-10-12',d),false);assert.equal(helpers.isRushDate('',d),false);});
check('signature formats',()=>{assert.ok(helpers.validateSignature('typed',''));assert.ok(helpers.validateSignature('drawn',png));for(const img of ['', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/png;base64,YmFk'])assert.equal(helpers.validateSignature('drawn',img),false);assert.equal(helpers.validateSignature('other',png),false);});
check('handoff requires checklist and acceptance',()=>{assert.equal(helpers.canCompleteHandoff({handoff_status:'accepted',handoff_items:[]}),false);assert.equal(helpers.canCompleteHandoff({handoff_status:'ready',handoff_items:[{required:true,completed:true}]}),false);assert.equal(helpers.canCompleteHandoff({handoff_status:'accepted',handoff_items:[{required:true,completed:false}]}),false);});
const request=b=>new Request('https://example.test',{method:'POST',body:JSON.stringify(b),headers:{'content-type':'application/json'}});
let record={id:'c',status:'active',project_title:'Test',handoff_status:'draft',handoff_internal_notes:'private',handoff_items:helpers.defaultHandoff()},role='admin';
const updates=[];
const entity={get:async()=>({...record}),update:async(id,x)=>{updates.push(x);return record={...record,...x};}};
const b={...helpers,createClientFromRequest:()=>({auth:{me:async()=>({role})},entities:{Contract:entity},asServiceRole:{entities:{Contract:entity}}})};
const handoff=load('base44/functions/projectHandoff/entry.ts',b);
async function invoke(action,extra={},status=200){const r=await handoff(request({contract_id:'c',action,...extra}));assert.equal(r.status,status,action+' '+await r.clone().text());return r.json();}
await invoke('publish',{},400);await invoke('complete',{},409);role='user';await invoke('save',{items:[]},403);role='admin';
await invoke('save',{items:record.handoff_items.map(x=>({...x,completed:true})),internal_notes:'private'});
const published=await invoke('publish');assert.ok(published.link.includes('?t='));
const token=record.handoff_token;
await invoke('view',{token:'wrong'},403);
const visible=await invoke('view',{token});assert.equal(visible.handoff.handoff_internal_notes,undefined);assert.equal(visible.handoff.handoff_token,undefined);
await invoke('accept',{token,name:'Test'},400);
await invoke('request_changes',{token,notes:'Please add training notes'});await invoke('accept',{token,name:'Test',consent:true},409);
await invoke('save',{items:record.handoff_items,internal_notes:'private'});await invoke('publish');
await invoke('view',{token},403);
await invoke('accept',{token:record.handoff_token,name:'Test',consent:true});
await invoke('save',{items:record.handoff_items},409);
await invoke('complete');assert.equal(record.status,'completed');assert.ok(record.delivered_at);
await invoke('reopen');assert.equal(record.status,'active');assert.equal(record.handoff_token,'');
checks++;console.log('PASS complete handoff lifecycle, access restrictions, revisions, acceptance and reopening');

const emails=[];let inv={id:'i',status:'open',client_email:'test@example.test',project_title:'Test',amount_total:1000,deposit_amount:500,reminder_enabled:true,reminder_next_at:'2020-01-01T00:00:00Z',reminder_interval_days:7,reminder_max_count:2,reminder_stage:'deposit'};
let payments=[{kind:'deposit',amount:125}],sendFail=false,identity={is_service:true};
const ie={get:async()=>({...inv}),filter:async()=>inv.reminder_enabled?[{...inv}]:[],update:async(id,x)=>(inv={...inv,...x})};
const reminder=load('base44/functions/processPaymentReminders/entry.ts',{...helpers,paymentSummary,esc:x=>String(x??''),brandedEmail:x=>x.content,brandButton:()=>'',detailRows:x=>JSON.stringify(x),createClientFromRequest:()=>({auth:{me:async()=>identity},asServiceRole:{entities:{Invoice:ie,Payment:{filter:async()=>payments},PricingSettings:{list:async()=>[]}},integrations:{Core:{SendEmail:async x=>{if(sendFail)throw Error('unknown');emails.push(x);}}}}})});
identity=null;assert.equal((await reminder(request({}))).status,403);identity={is_service:true};
assert.equal((await reminder(request({}))).status,200);assert.equal(emails.length,1);assert.match(emails[0].body,/\$375.00/);assert.equal(inv.reminder_sent_count,1);
await reminder(request({}));assert.equal(emails.length,1);
inv.reminder_next_at='2020-01-01T00:00:00Z';await reminder(request({}));assert.equal(emails.length,2);assert.equal(inv.reminder_enabled,false);
inv={...inv,reminder_enabled:true,reminder_sent_count:0,reminder_next_at:'2020-01-01T00:00:00Z'};payments=[{kind:'deposit',amount:500}];await reminder(request({}));assert.equal(emails.length,2);assert.equal(inv.reminder_enabled,false);
payments=[];inv={...inv,reminder_enabled:true};sendFail=true;await reminder(request({}));assert.equal(inv.reminder_enabled,false);assert.equal(inv.reminder_state,'error');
inv.reminder_enabled=true;await reminder(request({}));assert.equal(emails.length,2);
checks++;console.log('PASS reminders: service authorization, partial amount, timing, limit, paid stop, uncertain-send pause');

let signed={id:'c',status:'sent',access_token:'t',price_total:0,deposit_amount:0,handoff_internal_notes:'private'};
const signEntity={get:async()=>signed,update:async(id,x)=>(signed={...signed,...x}),filter:async()=>[{}],create:async()=>({})};
const sign=load('base44/functions/clientContract/entry.ts',{...helpers,esc:x=>String(x),brandedEmail:()=>'',brandButton:()=>'',resolveAdminEmail:async()=>'',createClientFromRequest:()=>({asServiceRole:{entities:{Contract:signEntity,Invoice:signEntity}}})});
assert.equal((await sign(request({id:'c',token:'t',action:'sign',signerName:'Test',consent:true,signatureMode:'drawn',signatureImage:''}))).status,400);
const result=await sign(request({id:'c',token:'t',action:'sign',signerName:'Test',consent:true,signatureMode:'drawn',signatureImage:png}));assert.equal(result.status,200);const body=await result.json();assert.equal(body.contract.signature_image,png);assert.equal(body.contract.handoff_internal_notes,undefined);
checks++;console.log('PASS drawn signature stored with consent; internal handoff data hidden');
console.log(checks+' delivery test groups passed. All email calls mocked; no external requests.');
