import {createClientFromRequest} from 'npm:@base44/sdk@0.8.44';
import {assistantContext,modelContext} from '../../shared/assistantContext.ts';
// Nova can read and prepare. The human-only review UI retains execution actions.
export async function handleNovaBusiness(req:Request){
 try{
  const client=createClientFromRequest(req), user=await client.auth.me().catch(()=>null);
  if(user?.role!=='admin')return Response.json({error:'Admin access required.'},{status:403});
  const body=await req.json();
  if(JSON.stringify(body).length>20000)throw Error('Please shorten the request.');
  const action=String(body.action||'context');
  const focus=String(body.client_email||'').trim().toLowerCase();
  if(focus&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(focus))throw Error('Choose a valid client email.');
  if(action==='context'){
   const ctx=await assistantContext(client,focus);
   const [bp]=await (client.asServiceRole?.entities?.BrandProfile?.list?.()||Promise.resolve([])).catch(()=>[]);
   const bcc=String(bp?.notify_email||'').trim();
   return Response.json({...modelContext(ctx),clients:ctx.clients,items:ctx.items,previous_briefings:ctx.history,review_url:'/admin/assistant?view=desk',sender:'roxanne@iroxannestudio.com',bcc});
  }
  const allowed=['ask','note','prepare_quote','calendar_options','plan_calendar'];
  if(!allowed.includes(action))return Response.json({error:'Nova can prepare drafts only. Roxanne approves emails and calendar changes in the review panel.'},{status:403});
  const input:any={action,client_email:focus};
  const fields:any={ask:['prompt'],note:['text','title'],prepare_quote:['lead_id'],calendar_options:['event_id'],plan_calendar:['event_id','operation','start']};
  for(const key of fields[action])if(typeof body[key]==='string')input[key]=body[key].slice(0,12000);
  const response=await client.functions.invoke('studioAssistant',input),data=response.data||response;
  if(data.error)throw Error(data.error);
  return Response.json({...data,review_url:'/admin/assistant?view=desk',sent:false});
 }catch(e){return Response.json({error:String((e as Error).message||'Unable to prepare this request.')},{status:400});}
}
Deno.serve(handleNovaBusiness);