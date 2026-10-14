import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const load=async(path,replacements={})=>{
 let code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 for(const [a,b]of Object.entries(replacements))code=code.replace(a,b);
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
};
const estimator=ts.transpileModule(fs.readFileSync('base44/shared/quoteEstimate.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const estimatorURL='data:text/javascript;base64,'+Buffer.from(estimator).toString('base64');
const q=await load('base44/shared/notesQuote.ts',{"'./quoteEstimate.ts'":JSON.stringify(estimatorURL)});
const lead={id:'test',name:'Test',email:'nobody@example.invalid',request_type:'quote_request',quick_pitch:'Customers book appointments and pay using Square. Staff need access.',selected_package:'Custom Application',must_have_features:[],nice_to_have_features:[],integrations_needed:[]};
const raw={summary:'Booking and payment app',project_type:'app',scope_clear:true,
features:[{label:q.FEATURES[0],evidence:'Customers book appointments'},{label:q.FEATURES[3],evidence:'pay using Square'},{label:q.FEATURES[6],evidence:'Staff need access'}],
integrations:[{label:q.INTEGRATIONS[0],evidence:'pay using Square'}],questions:[],assumptions:[],unsupported:[]};
const settings={rate_per_hour:100,packages:[{name:'Business',price:3000},{name:'Custom',price:5000}]};
const a=q.buildNotesEstimate(lead,raw,settings);
assert.equal(a.estimate.hoursLow,28);
assert.equal(a.estimate.hoursHigh,45);
assert.equal(a.estimate.priceLow,3000);
assert.equal(a.estimate.priceHigh,5000);
assert.equal(q.buildNotesEstimate(lead,{...raw,price_total:1},settings).estimate.priceHigh,5000,'Model cannot set money');
assert.equal(q.buildNotesEstimate(lead,{...raw,scope_clear:false},settings).estimate,null);
assert.equal(q.buildNotesEstimate(lead,{...raw,features:[...raw.features,{label:q.FEATURES[10],evidence:'invented evidence'}]},settings).estimate,null);
assert.equal(q.buildNotesEstimate(lead,raw,{}).estimate,null);
assert.equal(q.buildNotesEstimate({...lead,selected_package:'Mobile App'},raw,settings).estimate,null);
assert.equal(q.buildNotesEstimate({...lead,compliance_requirements:'HIPAA'},raw,settings).estimate,null);
assert.equal(q.buildNotesEstimate(lead,{...raw,project_type:'website'},settings).estimate,null);
assert.equal(q.buildNotesEstimate(lead,{...raw,unsupported:['Complex data migration']},settings).estimate,null);
assert.throws(()=>q.buildNotesEstimate(lead,{},settings));
assert.equal(JSON.stringify(q.quoteSource(lead)).includes(lead.email),false,'Contact email is not sent to model');
let proposals=[],updates=[],llmCalls=0;
const client={asServiceRole:{entities:{
 Proposal:{filter:async()=>proposals,create:async(data)=>{const p={id:'draft-test',...data};proposals.push(p);return p;}},
 PricingSettings:{list:async()=>[settings]},Lead:{update:async(id,data)=>updates.push(data)}
},integrations:{Core:{InvokeLLM:async()=>{llmCalls++;return raw;}}}}};
const result=await q.prepareNotesQuote(client,lead);
assert.equal(result.sent,false);
assert.equal(proposals[0].status,'draft');
assert.equal(proposals[0].requires_scope_review,true);
assert.equal(proposals[0].access_token,undefined);
assert.equal(proposals[0].price_total,5000);
assert.ok(updates[0].draft_estimate_json);
await q.prepareNotesQuote(client,lead);
assert.equal(proposals.length,1);
assert.equal(llmCalls,1,'Repeat request does not regenerate or overwrite');
proposals=[{id:'sent-test',status:'sent',price_total:999}];
await q.prepareNotesQuote(client,lead);
assert.equal(proposals[0].price_total,999);
assert.equal(llmCalls,1,'Sent proposal is preserved');
proposals=[];
client.asServiceRole.integrations.Core.InvokeLLM=async()=>{throw new Error('Provider unavailable');};
await assert.rejects(q.prepareNotesQuote(client,lead));
assert.equal(proposals.length,0,'Failure does not create a misleading proposal');
// Check the real send handler with mocked authentication and email transport.
globalThis.quoteTestClient={auth:{},entities:{Proposal:{get:async()=>({requires_scope_review:true,client_email:'nobody@example.invalid'})}}};
globalThis.quoteTestSent=0;
const sendSource=fs.readFileSync('base44/functions/sendProposal/entry.ts','utf8');
const temp='base44/functions/sendProposal/entry.ts';
const send=await load(temp,{
"import { sendStudioEmail } from '../../shared/studioEmail.ts';":"const sendStudioEmail=async()=>{globalThis.quoteTestSent++;};",
"import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';":"const createClientFromRequest=()=>globalThis.quoteTestClient;",
"import { requireAdmin } from '../../shared/marketingAdmin.ts';":"const requireAdmin=async()=>({ok:true});",
"import { esc, brandedEmail, brandButton } from '../../shared/emailBrand.ts';":"const esc=x=>x,brandedEmail=x=>x,brandButton=x=>x;",
"import { studioUrl } from '../../shared/studioUrl.ts';":"const studioUrl=()=>'';",
"import { validateSchedule } from '../../shared/paymentSchedule.ts';":"const validateSchedule=()=>[];"
});
const response=await send.default(new Request('https://example.invalid',{method:'POST',body:JSON.stringify({proposal_id:'draft-test'})}));
assert.equal(response.status,409);
assert.equal(globalThis.quoteTestSent,0);
console.log('PASS: supported scope, configured prices, missing details, unsupported requirements, evidence rejection, no model pricing, private drafts, retry protection, failure handling and send-review gate.');
