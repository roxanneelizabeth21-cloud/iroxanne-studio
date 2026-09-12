import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
function load(file, bindings={}) {
 let source=fs.readFileSync(file,'utf8').replace(/^import .*;\n/gm,'').replace(/export default /,'return ').replace(/export function /g,'function ');
 if(file.endsWith('paymentSummary.ts')) source+='\nreturn paymentSummary;';
 const js=ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None});
 return new Function(...Object.keys(bindings),js)(...Object.values(bindings));
}
const summary=load('base44/shared/paymentSummary.ts');
let checks=0;
const check=(label,fn)=>{fn();checks++;console.log('PASS '+label);};
check('partial deposit uses cents',()=>assert.equal(summary({amount_total:1500,deposit_amount:750},[{kind:'deposit',amount:250.25}]).depositOutstanding,499.75));
check('legacy deposit remains recorded',()=>assert.equal(summary({amount_total:1500,deposit_amount:750,deposit_status:'paid',balance_paid_amount:0},[{kind:'balance',amount:100}]).paid,850));
check('legacy baseline plus new payments',()=>assert.equal(summary({amount_total:1500,deposit_amount:750,legacy_deposit_cents:75000,legacy_balance_cents:0},[{kind:'balance',amount:750}]).outstanding,0));
check('waived deposit is not reported as money paid',()=>{const s=summary({amount_total:1500,deposit_amount:750,deposit_status:'waived'},[]);assert.equal(s.paid,0);assert.equal(s.outstanding,750);});
function mocks(record) {
 const writes=[], emails=[]; const entity={get:async()=>record,update:async(id,x)=>{writes.push(x);return {...record,...x};},create:async x=>{writes.push(x);return {...x,id:'contract1'};},filter:async()=>[],list:async()=>[]};
 const client={entities:{Proposal:entity,Contract:entity,Invoice:entity,Payment:entity,PricingSettings:entity,Lead:entity},asServiceRole:{entities:{Proposal:entity,Contract:entity,Invoice:entity,Lead:entity,PricingSettings:entity},integrations:{Core:{SendEmail:async x=>emails.push(x)}}}};
 return {writes,emails,client, bindings:{createClientFromRequest:()=>client,requireAdmin:async()=>({ok:true}),esc:x=>String(x||''),resolveAdminEmail:async()=>'',brandedEmail:x=>x.content,brandButton:()=>'',detailRows:()=>'',paymentSummary:summary}};
}
const request=b=>new Request('https://example.test',{method:'POST',body:JSON.stringify(b),headers:{'content-type':'application/json'}});
async function scenario(name,file,record,body,status,verify=()=>{}) {
 const m=mocks(record),fn=load(file,m.bindings);const res=await fn(request(body));assert.equal(res.status,status,name);await verify(m,await res.json());checks++;console.log('PASS '+name);
}
const pfile='base44/functions/clientProposal/entry.ts';
await scenario('invalid proposal token rejected',pfile,{access_token:'right',status:'sent'},{id:'p',token:'wrong',action:'accept'},403,m=>assert.equal(m.writes.length,0));
await scenario('expired proposal rejected',pfile,{access_token:'t',status:'sent',expires_at:'2020-01-01T00:00:00Z'},{id:'p',token:'t',action:'accept'},409,m=>assert.equal(m.writes.length,0));
await scenario('change request saved',pfile,{access_token:'t',status:'sent'},{id:'p',token:'t',action:'request_changes',change_request:'Add booking'},200,(m,b)=>assert.equal(b.proposal.status,'changes_requested'));
await scenario('accept blocked while revision pending',pfile,{access_token:'t',status:'changes_requested'},{id:'p',token:'t',action:'accept'},409);
await scenario('draft cannot be accepted',pfile,{access_token:'t',status:'draft'},{id:'p',token:'t',action:'accept'},409);
await scenario('accept creates draft contract and carries scope',pfile,{access_token:'t',status:'sent',price_total:1500,deliverables:['Booking'],scope_summary:'Build app',client_email:'test@example.test'},{id:'p',token:'t',action:'accept'},200,m=>{assert.equal(m.writes[0].status,'draft');assert.equal(m.writes[0].deposit_amount,750);assert.match(m.writes[0].scope_summary,/Booking/);});
await scenario('signature requires consent','base44/functions/clientContract/entry.ts',{access_token:'t',status:'sent'},{id:'c',token:'t',action:'sign',signerName:'Test'},400,m=>assert.equal(m.writes.length,0));
await scenario('cancelled contract cannot be signed','base44/functions/clientContract/entry.ts',{access_token:'t',status:'cancelled'},{id:'c',token:'t',action:'sign',signerName:'Test',consent:true},409);
await scenario('cancelled invoice rejects payment','base44/functions/recordPayment/entry.ts',{status:'cancelled'},{invoice_id:'i',request_id:'r',kind:'deposit',amount:10},409);
await scenario('overpayment rejected','base44/functions/recordPayment/entry.ts',{amount_total:100,deposit_amount:50},{invoice_id:'i',request_id:'r',kind:'deposit',amount:60},400);
const send=mocks({status:'draft',client_email:'test@example.test',project_title:'Test',price_total:1500,deposit_percent:50});send.client.entities.PricingSettings.list=async()=>[{proposal_valid_days:3,packages:[{}]}];
const fn=load('base44/functions/sendProposal/entry.ts',send.bindings);const start=Date.now();const res=await fn(request({proposal_id:'abc123'}));assert.equal(res.status,200);const expiry=new Date(send.writes[0].expires_at).getTime();assert.ok(expiry-start>=72*3600000&&expiry-start<72*3600000+10000);checks++;console.log('PASS 72-hour expiry starts on send');

const live=mocks({});
let invoice={id:'inv',amount_total:1500,deposit_amount:750,deposit_status:'pending',balance_status:'pending',balance_amount:750,contract_id:'c',status:'open'};
let contract={id:'c',status:'signed'};let ledger=[];
live.client.entities.Invoice.get=async()=>({...invoice});
live.client.entities.Invoice.update=async(id,x)=>(invoice={...invoice,...x});
live.client.entities.Payment.filter=async()=>ledger;
live.client.entities.Payment.create=async x=>{const p={...x,id:'p'+ledger.length};ledger.push(p);return p;};
live.client.entities.Contract.get=async()=>contract;
live.client.entities.Contract.update=async(id,x)=>(contract={...contract,...x});
const pay=load('base44/functions/recordPayment/entry.ts',live.bindings);
const payBody={invoice_id:'inv',request_id:'first',kind:'deposit',method:'transfer',amount:250,notify_client:false};
assert.equal((await pay(request(payBody))).status,200);
assert.equal(invoice.deposit_paid_amount,250);assert.equal(invoice.deposit_status,'pending');assert.equal(contract.status,'signed');
assert.equal((await pay(request(payBody))).status,200);assert.equal(ledger.length,1);
assert.equal((await pay(request({...payBody,amount:300}))).status,409);
assert.equal((await pay(request({...payBody,request_id:'second',amount:500}))).status,200);
assert.equal(invoice.deposit_status,'paid');assert.equal(contract.status,'active');
assert.equal((await pay(request({...payBody,request_id:'third',kind:'balance',amount:750}))).status,200);
assert.equal(invoice.status,'paid');assert.equal(contract.status,'active');assert.equal(live.emails.length,0);
console.log('PASS full payment lifecycle, partials, retry protection, and delivery independence');

console.log((checks+1)+' workflow tests passed; no external requests or real emails.');
