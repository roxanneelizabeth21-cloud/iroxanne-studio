const fs=require('fs'),path=require('path'),ts=require('typescript'),assert=require('node:assert/strict');
global.crypto=require('node:crypto').webcrypto;
function load(file,overrides={}) {const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(n=>overrides[n]||(n.startsWith('.')?load(path.resolve(path.dirname(file),n),overrides):require(n)),m,m.exports);return m.exports;}
(async()=>{
const master=fs.readFileSync('docs/project-agreement-final.txt','utf8').trim();
const {withHandoffTerms}=load('base44/shared/paymentSchedule.ts');
assert.equal(withHandoffTerms(master),master,'current agreement must not get a second handoff clause');
let contract={id:'review',status:'sent',access_token:'private-token',client_name:'Review Client',client_email:'review@example.invalid',project_title:'Isolated review',terms:master,price_total:3500,deposit_amount:500},invoices=[],emails=[];
const entities={Contract:{get:async()=>({...contract}),update:async(id,patch)=>(contract={...contract,...patch})},Invoice:{filter:async()=>invoices,create:async data=>{const invoice={id:'invoice-review',...data};invoices.push(invoice);return invoice}}};
const base={asServiceRole:{entities,integrations:{Core:{SendEmail:async data=>emails.push(data)}}}};
const handler=load('base44/functions/clientContract/entry.ts',{'npm:@base44/sdk@0.8.44':{createClientFromRequest:()=>base},'../../shared/emailBrand.ts':{esc:s=>String(s),resolveAdminEmail:async()=>'',brandedEmail:o=>o.content,brandButton:(label,url)=>'<a href="'+url+'">'+label+'</a>'}}).default;
const call=body=>handler(new Request('https://example.invalid',{method:'POST',headers:{'user-agent':'isolated-test'},body:JSON.stringify({id:'review',token:'private-token',...body})}));
assert.equal((await call({action:'sign',token:'wrong'})).status,403);
assert.equal((await call({action:'sign',signerName:'Review Client',consent:false})).status,400);
assert.equal((await call({action:'sign',signerName:'Review Client',consent:true})).status,200);
assert.equal(contract.terms,master);assert.equal(contract.signature_consent,true);assert.equal(invoices.length,1);assert.equal(invoices[0].deposit_amount,500);assert.equal(invoices[0].balance_amount,3000);
assert.ok(emails[0].html.includes('https://iroxannestudio.com/contract/review?t=private-token'));
assert.ok(emails[0].html.includes('/invoice/invoice-review?t='));
assert.equal((await call({action:'sign',signerName:'Review Client',consent:true})).status,409);
assert.equal(invoices.length,1);
console.log('PASS unchanged agreement text; token and consent guards; typed signature; one invoice; signed-agreement and invoice email links; repeat signing blocked. Mocked only.');
})().catch(e=>{console.error(e);process.exit(1)});
