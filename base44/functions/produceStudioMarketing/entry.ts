import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { STUDIO_CONTEXT } from '../../shared/marketingAdmin.ts';
import { productionSlots, validateCopy } from '../../shared/marketingProduction.ts';
export default async function(req) {
 const b=createClientFromRequest(req);
 const user=await b.auth.me().catch(()=>null);
 if(!user || (user.role!=='admin' && user.is_service!==true)) return Response.json({error:'Forbidden'},{status:403});
 const e=b.asServiceRole.entities;
 const settings=(await e.MarketingAutomation.list())[0];
 if(!settings?.enabled) return Response.json({paused:true});
 let job;
 try {
  const jobs=await e.MarketingProduction.list('-created_date',100);
  const slots=productionSlots();
  const slot=slots.find(s=>!jobs.some(j=>j.slot_key===s.date && (j.phase==='complete'||j.attempts>=3)));
  if(!slot) return Response.json({complete:true});
  job=jobs.find(j=>j.slot_key===slot.date);
  if(!job) job=await e.MarketingProduction.create({slot_key:slot.date,scheduled_date:slot.date,phase:'copy',attempts:0});
  await e.MarketingProduction.update(job.id,{attempts:(job.attempts||0)+1});
  let content=job.content;
  if(!content?.facebook) {
   const recent=await e.MarketingPost.list('-created_date',30);
   const themes=['an early idea becoming useful','an everyday task that could be easier','a hypothetical community or family app','a warm referral invitation'];
   content=await b.asServiceRole.integrations.Core.InvokeLLM({
    prompt:STUDIO_CONTEXT+'\nCreate one story with separate Facebook and Instagram captions. Theme: '+themes[slot.index]+'. No invented personal anecdotes, clients, results, prices or promises. Use hypothetical situations, not claims about completed work. Instagram should invite a conversation, not promise a clickable caption link. Return facebook, instagram, hook, image_prompt. Image must be a meaningful editorial illustration in plum/cream/gold, no text or fake UI. Avoid recent hooks: '+JSON.stringify(recent.map(p=>p.hook).filter(Boolean)),
    response_json_schema:{type:'object',properties:{facebook:{type:'string'},instagram:{type:'string'},hook:{type:'string'},image_prompt:{type:'string'}},required:['facebook','instagram','hook','image_prompt']}
   });
   validateCopy(content);
   await e.MarketingProduction.update(job.id,{content,phase:'image'});
  }
  validateCopy(content);
  let image_url=job.image_url;
  if(!image_url) {
   const image=await b.asServiceRole.integrations.Core.GenerateImage({prompt:content.image_prompt+' Finished editorial graphic, 4:5 portrait, textured plum, warm cream, restrained gold. No text, no logos, no invented app interface. Keep subject within generous margins.'});
   image_url=image?.url||image?.data?.url;
   if(!image_url || !/^https:\/\//.test(image_url)) throw new Error('Image service did not return a usable asset');
   await e.MarketingProduction.update(job.id,{image_url,phase:'quality'});
   await e.GalleryImage.create({title:content.hook,image_url,category:'promo',source:'ai_generated',generation_prompt:content.image_prompt,aspect_ratio:'4:5'});
  }
  const quality=await b.asServiceRole.integrations.Core.InvokeLLM({
   prompt:'Review this marketing draft and image for iRoxanne Studio. Pass only if warm, nontechnical, truthful hypothetical copy, no invented client stories or outcomes, no pricing or guarantees, no gibberish or malformed imagery. Reject repetitive generic sales copy. Assess the actual attached image; if unavailable set pass=false. Return pass boolean and reason. Copy: '+JSON.stringify(content),
   file_urls:[image_url],response_json_schema:{type:'object',properties:{pass:{type:'boolean'},reason:{type:'string'}},required:['pass','reason']}
  });
  // Owner requires personal approval for every post; AI checks never approve.
  const automatic=false;
  if (!!job.facebook_post_id !== !!job.instagram_post_id) throw new Error('An earlier two-record story needs review before production can complete. Existing content was preserved.');
  if (!job.facebook_post_id && !job.instagram_post_id) {
   const marker='studio-production:'+job.id+':story';
   const existing=await e.MarketingPost.filter({description:marker},'-created_date',1);
   const post=existing[0]||await e.MarketingPost.create({
    description:marker,platform:'Facebook',publish_targets:['Facebook','Instagram'],
    format:'Feed Post',content_bucket:'Authentic/Personal',caption:content.facebook,
    hook:content.hook,image_prompt:content.image_prompt,media_file_url:image_url,media_type:'image',
    scheduled_date:slot.date,scheduled_time:'12:00',scheduled_timezone:'America/New_York',
    status:'Pending Review',approval_status:'Pending Review',publish_mode:'manual',link_target:'None',
    create_post_state:{platformIds:['facebook','instagram'],platformCaptions:{facebook:content.facebook,instagram:content.instagram},link:'',goal:'Build brand awareness'}
   });
   await e.MarketingProduction.update(job.id,{facebook_post_id:post.id,instagram_post_id:post.id});
  }
  await e.MarketingProduction.update(job.id,{phase:'complete',error:quality?.pass?'':String(quality?.reason||'Needs visual review')});
  await e.MarketingAutomation.update(settings.id,{last_run:new Date().toISOString(),last_error:''});
  return Response.json({produced:true,automatic,job_id:job.id});
 } catch(error) {
  const message=String(error.message).slice(0,500);
  if(job) await e.MarketingProduction.update(job.id,{error:message});
  await e.MarketingAutomation.update(settings.id,{last_run:new Date().toISOString(),last_error:message});
  const day = new Date().toISOString().slice(0,10);
  if (settings.last_notice !== day) {
   await e.MarketingAutomation.update(settings.id,{last_notice:day});
   try { await b.asServiceRole.integrations.Core.SendEmail({to:'roxanneelizabeth21@gmail.com',subject:'iRoxanne Studio marketing needs attention',body:'Automatic content production could not complete a story. Your existing posts are safe. Open https://iroxannestudio.com/marketing/controls to see the error and production status.'}); } catch {}
  }
  return Response.json({error:message},{status:500});
 }
}
