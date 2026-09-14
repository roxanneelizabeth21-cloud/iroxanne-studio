// Isolated tests: all provider requests and database operations are mocked.
const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,overrides={}) {
 const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};
 new Function('require','module','exports',out)((name)=>overrides[name] || (name.startsWith('.')?load(path.resolve(path.dirname(file),name),overrides):require(name)),m,m.exports);
 return m.exports;
}
const {validateSchedule,squareRequests}=load('base44/shared/paymentSchedule.ts');
const {publishSquareSchedule,syncSquareSchedule}=load('base44/shared/squareSchedule.ts');
const {paymentSummary}=load('base44/shared/paymentSummary.ts');
let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
function fixture(n=7){
 const total=350001,each=Math.floor(total/n);
 let invoice={id:'local1',contract_id:'contract1',client_email:'test@example.com',project_title:'Test project',amount_total:total/100,deposit_amount:each/100,status:'open',square_schedule_enabled:true,payment_installments:Array.from({length:n},(_,i)=>({label:i===0?'Deposit':'Payment '+(i+1),amount:(each+(i===n-1?total-each*n:0))/100,due_date:'2026-10-'+String(i+1).padStart(2,'0')}))};
 if(n===1) invoice.deposit_amount=invoice.amount_total;
 let contract={id:'contract1',status:'signed'}, remote, publishes=0, prior=[],failUpdate=false,failPublish=false;
 const requests=[], keys=new Map();
 const db={Invoice:{update:async(id,p)=>{if(failUpdate){failUpdate=false;throw Error('Database unavailable');}invoice={...invoice,...p};return structuredClone(invoice);}},Contract:{get:async()=>({...contract}),update:async(id,p)=>{contract={...contract,...p};return contract;}},Payment:{filter:async()=>prior},SquareCheckout:{filter:async()=>[]}};
 const api=async(p,b)=>{
   requests.push({p,b:structuredClone(b)});
   if(!b&&p==='locations')return {locations:[{id:'location1',status:'ACTIVE',currency:'USD'}]};
   if(p==='customers')return {customer:{id:'customer1'}};
   if(p==='orders')return {order:{id:'order1'}};
   if(p==='invoices'&&b){
     if(!remote){remote={...b.invoice,id:'square1',version:0,status:'DRAFT',payment_requests:b.invoice.payment_requests.map((r,i)=>({...r,computed_amount_money:{amount:Math.round(invoice.payment_installments[i].amount*100),currency:'USD'},total_completed_amount_money:{amount:0,currency:'USD'}}))};}
     return {invoice:structuredClone(remote)};
   }
   if(p==='invoices/square1/publish'){if(failPublish){failPublish=false;throw Error('Square unavailable');}if(!keys.has(b.idempotency_key)){publishes++;keys.set(b.idempotency_key,true);}remote.status='UNPAID';remote.public_url='https://squareup.com/pay-invoice/test';return {invoice:structuredClone(remote)};}
   if(p==='invoices/square1')return {invoice:structuredClone(remote)};
   throw Error('Unexpected mocked path '+p);
 };
 const base={asServiceRole:{entities:db,connectors:{getConnection:async()=>({accessToken:'MOCK_ONLY'})}}};
 const fetch=async(url,opts)=>{try{return {ok:true,json:async()=>await api(url.split('/v2/')[1],opts.body?JSON.parse(opts.body):undefined)};}catch(e){throw e;}};
 return {base,api,fetch,get invoice(){return invoice},get remote(){return remote},get contract(){return contract},get publishes(){return publishes},requests,setPrior(p){prior=p},failNextUpdate(){failUpdate=true},failNextPublish(){failPublish=true}};
}
(async()=>{
 await test('one through seven requests preserve every penny and disable automatic charging',()=>{
   for(let n=1;n<=7;n++){const f=fixture(n), rows=validateSchedule(f.invoice.payment_installments,f.invoice.amount_total), reqs=squareRequests(rows);assert.equal(reqs.length,n);assert(reqs.every(r=>r.automatic_payment_source==='NONE'));if(n>=3)assert.equal(reqs[1].request_type,'INSTALLMENT');}
 });
 await test('reject invalid sums, eight payments, impossible dates, duplicate dates and sub-cent amounts',()=>{
   const row={label:'Deposit',amount:100,due_date:'2026-10-01'};
   for(const rows of [[],Array(8).fill(row),[{...row,amount:-1}],[{...row,amount:100.001}],[{...row,due_date:'2026-02-30'}],[row,row],[{...row,amount:199}]])assert.throws(()=>validateSchedule(rows,200));
 });
 await test('publish seven-payment plan; retries do not create another invoice or publish twice',async()=>{
   const f=fixture();global.fetch=f.fetch;
   await publishSquareSchedule(f.base,f.invoice);await publishSquareSchedule(f.base,f.invoice);
   assert.equal(f.publishes,1);assert.equal(f.requests.filter(x=>x.p==='invoices'&&x.b).length,1);assert.equal(f.invoice.square_payment_snapshot.length,7);assert.equal(f.invoice.square_public_url,'https://squareup.com/pay-invoice/test');
 });
 await test('partial deposit stays unpaid; completed deposit activates contract; repeated sync never adds money',async()=>{
   const f=fixture();global.fetch=f.fetch;await publishSquareSchedule(f.base,f.invoice);
   f.remote.payment_requests[0].total_completed_amount_money.amount=10000;
   await syncSquareSchedule(f.base,f.invoice,f.api);assert.equal(f.invoice.deposit_status,'pending');assert.equal(f.contract.status,'signed');
   const due=f.remote.payment_requests[0].computed_amount_money.amount;
   f.remote.payment_requests[0].total_completed_amount_money.amount=due;
   await syncSquareSchedule(f.base,f.invoice,f.api);await syncSquareSchedule(f.base,f.invoice,f.api);
   assert.equal(f.contract.status,'active');assert(f.contract.deposit_paid_at);
   assert.equal(paymentSummary(f.invoice,[]).paid,due/100);
 });
 await test('completed plan totals exactly; final one-cent remainder retained',async()=>{
   const f=fixture();global.fetch=f.fetch;await publishSquareSchedule(f.base,f.invoice);
   for(const p of f.remote.payment_requests)p.total_completed_amount_money.amount=p.computed_amount_money.amount;
   await syncSquareSchedule(f.base,f.invoice,f.api);assert.equal(f.invoice.status,'paid');assert.equal(paymentSummary(f.invoice,[]).outstanding,0);assert.equal(paymentSummary(f.invoice,[]).paid,3500.01);
 });
 await test('reject another invoice/order, altered amount, changed date and refund without crediting local invoice',async()=>{
   for(const change of [s=>s.order_id='wrong',s=>s.location_id='wrong',s=>s.id='wrong',s=>s.payment_requests[0].computed_amount_money.amount++,s=>s.payment_requests[0].due_date='2026-11-01',s=>s.status='PARTIALLY_REFUNDED']){
     const f=fixture();global.fetch=f.fetch;await publishSquareSchedule(f.base,f.invoice);const before=structuredClone(f.invoice);change(f.remote);await assert.rejects(syncSquareSchedule(f.base,f.invoice,f.api));assert.deepEqual(f.invoice,before);
   }
 });
 await test('publish failure can be retried using persisted Square invoice binding',async()=>{
   const f=fixture();global.fetch=f.fetch;f.failNextPublish();await assert.rejects(publishSquareSchedule(f.base,f.invoice));assert.equal(f.invoice.square_invoice_id,'square1');await publishSquareSchedule(f.base,f.invoice);assert.equal(f.publishes,1);
 });
 await test('database failure after payment recovers on next sync without a second ledger entry',async()=>{
   const f=fixture();global.fetch=f.fetch;await publishSquareSchedule(f.base,f.invoice);f.remote.payment_requests[0].total_completed_amount_money.amount=10000;f.failNextUpdate();await assert.rejects(syncSquareSchedule(f.base,f.invoice,f.api));await syncSquareSchedule(f.base,f.invoice,f.api);assert.equal(paymentSummary(f.invoice,[]).paid,100);
 });
 await test('existing payment activity cannot be migrated to a new Square plan',async()=>{
   const f=fixture();global.fetch=f.fetch;f.setPrior([{amount:100}]);await assert.rejects(publishSquareSchedule(f.base,f.invoice),/payment activity/);assert.equal(f.publishes,0);
 });
 console.log(passed+' isolated payment-plan tests passed. No live payments or emails sent.');
})().catch(e=>{console.error(e);process.exitCode=1});
