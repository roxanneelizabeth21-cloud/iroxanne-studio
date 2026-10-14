import {createClientFromRequest} from 'npm:@base44/sdk@0.8.44';
import {prepareNotesQuote} from '../../shared/notesQuote.ts';
export default async function(req:Request){
 try{
 const client=createClientFromRequest(req);
 const user=await client.auth.me();
 if(!user||user.role!=='admin')return Response.json({error:'Admin access required'},{status:403});
 const body=await req.json();
 const lead=await client.entities.Lead.get(String(body.lead_id||''));
 if(!lead||lead.request_type!=='quote_request')return Response.json({error:'Quote request not found'},{status:404});
 return Response.json(await prepareNotesQuote(client,lead));
 }catch{return Response.json({error:'Draft preparation could not finish. Your request is saved; please retry or build a proposal manually.'},{status:503});}
}