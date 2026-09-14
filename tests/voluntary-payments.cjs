const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,overrides={}) {const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(n=>overrides[n]||(n.startsWith('.')?load(path.resolve(path.dirname(file),n),overrides):require(n)),m,m.exports);return m.exports;}
global.crypto=require('node:crypto').webcrypto;
const {applyInvoicePayment}=load('base44/shared/invoicePayments.ts');
function fixture(){let invoice={id:'i',contract_id:'c',amount_total:3500,deposit_amount:1750,status:'open',access_token:'token',client_email:'test@example.com'},payments=[],contract={id:'c',status:'signed'},fail=false;
const db={Invoice:{get:async()=>({...invoice}),update:async(id,p)=>{if(fail)throw Error('write failure');return invoice={...invoice,...p};}},Payment:{filter:async()=>payments,create:async p=>{payments.push(p);return p;}},Contract:{get:async()=>contract,update:async(id,p)=>contract={...contract,...p}},SquareCheckout:{create:async()=>{}}};
return {base:{asServiceRole:{entities:db,connectors:{getConnection:async()=>({accessToken:'mock'})}}},get invoice(){return invoice},get payments(){return payments},get contract(){return contract},fail(){fail=true}};}
(async()=>{
const f=fixture();const pay=(amount,id)=>applyInvoicePayment(f.base,{invoice_id:'i',request_id:id,kind:'project',method:'square',amount,enforceOutstanding:true});
let r=await pay(500,'a');assert.equal(r.summary.depositOutstanding,1250);assert.equal(f.contract.status,'signed');
r=await pay(1500,'b');assert.equal(r.summary.depositPaid,1750);assert.equal(r.summary.balancePaid,250);assert.equal(f.contract.status,'active');
r=await pay(1500,'b');assert.equal(r.duplicate,true);assert.equal(r.summary.paid,2000);
r=await pay(1500,'c');assert.equal(r.summary.outstanding,0);assert.equal(r.invoice.status,'paid');assert.equal(f.payments.length,3);
await assert.rejects(pay(1,'d'));
const full=fixture();r=await applyInvoicePayment(full.base,{invoice_id:'i',request_id:'full',kind:'project',amount:3500,enforceOutstanding:true});assert.equal(r.summary.depositPaid,1750);assert.equal(r.summary.balancePaid,1750);
const fail=fixture();fail.fail();await assert.rejects(applyInvoicePayment(fail.base,{invoice_id:'i',request_id:'fail',kind:'project',amount:100}));assert.equal(fail.payments.length,0);
const {paymentSummary}=load('base44/shared/paymentSummary.ts');assert.equal(paymentSummary({amount_total:3500,deposit_amount:1750,deposit_status:'paid'},[]).outstanding,1750);
console.log('PASS full payment, voluntary payments, deposit allocation, repeat event, overpayment guard, legacy balance and failed-baseline protection');
const c=fixture();let captured;global.fetch=async(url,opts)=>{if(url.endsWith('/locations'))return {json:async()=>({locations:[{id:'loc',status:'ACTIVE'}]})};captured=JSON.parse(opts.body);return {ok:true,json:async()=>({payment_link:{order_id:'order',url:'https://squareup.com/test'}})};};
const handler=load('base44/functions/createSquareCheckout/entry.ts',{'npm:@base44/sdk@0.8.44':{createClientFromRequest:()=>c.base},'../../shared/studioUrl.ts':{studioUrl:()=> 'https://example.com'}}).default;
const call=(amount,token='token')=>handler(new Request('https://example.com',{method:'POST',body:JSON.stringify({id:'i',token,kind:'project',...(amount===undefined?{}:{amount})})}));
for(const amount of [-1,0,3501,1.001,'bad'])assert.equal((await call(amount)).status,400);
assert.equal((await call(100,'wrong')).status,403);
assert.equal((await call(123.45)).status,200);assert.equal(captured.quick_pay.price_money.amount,12345);
assert.equal((await call()).status,200);assert.equal(captured.quick_pay.price_money.amount,350000);
console.log('PASS checkout token and amount checks; full and custom Square amounts (mocked only)');
})().catch(e=>{console.error(e);process.exit(1)});
