import {createClientFromRequest} from 'npm:@base44/sdk@0.8.44';
import {prepareNotesQuote,analyzeQuoteNotes} from '../../shared/notesQuote.ts';
Deno.serve(async(req:Request)=>{
 try{
 const client=createClientFromRequest(req);
 const user=await client.auth.me();
 if(!user||user.role!=='admin')return Response.json({error:'Admin access required'},{status:403});
 const body=await req.json();
 if(body.action==='sample'){
 const samples:any={
 salon:{business_type:'Hair salon',quick_pitch:'I need clients to book appointments online, keep customer records, and pay using Square. Two stylists need access. I use text messages today. For the first version I only want booking, client records, staff access and payments. No shop or marketing tools yet.',selected_package:'Custom Application'},
 unsure:{business_type:'Not sure',quick_pitch:'I do not know what I want to build yet. I would like help finding an idea.',selected_package:'Not sure'}
 };
 const sample=samples[body.sample==='unsure'?'unsure':'salon'];
 const rows=await client.entities.PricingSettings.list('-updated_date',20);
 const analysis=await analyzeQuoteNotes(client,sample,rows.find(x=>x.packages?.length)||rows[0]);
 return Response.json({analysis,source:sample.quick_pitch,saved:false,sent:false});
 }
 const lead=await client.entities.Lead.get(String(body.lead_id||''));
 if(!lead||lead.request_type!=='quote_request')return Response.json({error:'Quote request not found'},{status:404});
 return Response.json(await prepareNotesQuote(client,lead));
 }catch{return Response.json({error:'Draft preparation could not finish. Your request is saved; please retry or build a proposal manually.'},{status:503});}
});