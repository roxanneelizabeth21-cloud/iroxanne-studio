import {estimateProject} from '../../shared/quoteEstimate.ts';
import {createClientFromRequest} from 'npm:@base44/sdk@0.8.44';
const enc=new TextEncoder();
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const hash=async(text:string)=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(text))));
const fail=(message:string,status=400)=>{const e:any=new Error(message);e.status=status;throw e;};
const emailOf=(value:any)=>{
 const email=String(value||'').trim().toLowerCase();
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Please enter a valid email address.');
 return email;
};
async function sendCode(client:any,email:string,code:string){
 const {accessToken}=await client.asServiceRole.connectors.getConnection('gmail');
 if(!accessToken)fail('Email sending is unavailable. Please try again shortly.',503);
 const headers={Authorization:'Bearer '+accessToken};
 const profileResponse=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile',{headers});
 const profile=await profileResponse.json();
 if(!profileResponse.ok||profile.emailAddress?.toLowerCase()!=='roxanne@iroxannestudio.com')fail('The studio email connection needs attention. Please try again shortly.',503);
 const text='Your iRoxanne Studio verification code is: '+code+'\r\n\r\nThis code expires in 10 minutes. Enter it in the quote form to confirm your email address. If you did not request it, ignore this email.';
 const raw='From: iRoxanne Studio <roxanne@iroxannestudio.com>\r\nTo: '+email+'\r\nSubject: Your iRoxanne Studio verification code\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n'+btoa(text);
 const encoded=btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
 const response=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({raw:encoded})});
 if(!response.ok)fail('We could not send the code. Please try again shortly.',503);
}
export default async function(req:Request){
 try{
  const b=await req.json(),client=createClientFromRequest(req),db=client.asServiceRole.entities;
  const email=emailOf(b.email),now=Date.now();
  if(b.action==='send'){
   const emailHash=await hash(email);
   const recent=await db.QuoteEmailVerification.filter({email_hash:emailHash},'-created_date',20);
   if(recent.some((r:any)=>now-Date.parse(r.created_date)<60000))fail('Please wait one minute before requesting another code.',429);
   if(recent.filter((r:any)=>now-Date.parse(r.created_date)<3600000).length>=5)fail('Too many code requests. Please try again in an hour.',429);
   const global=await db.QuoteEmailVerification.list('-created_date',200);
   if(global.filter((r:any)=>now-Date.parse(r.created_date)<86400000).length>=200)fail('Email verification is temporarily busy. Please try again later.',429);
   const secret=hex(crypto.getRandomValues(new Uint8Array(32)));
   let random=crypto.getRandomValues(new Uint32Array(1))[0];
   while(random>=4294000000)random=crypto.getRandomValues(new Uint32Array(1))[0];
   const code=String(random%1000000).padStart(6,'0');
   const record=await db.QuoteEmailVerification.create({email,email_hash:emailHash,secret_hash:await hash(secret),code_hash:await hash(secret+':'+code),expires_at:new Date(now+600000).toISOString(),sent:false});
   await sendCode(client,email,code);
   await db.QuoteEmailVerification.update(record.id,{sent:true});
   return Response.json({id:record.id,secret,expires_in:600});
  }
  if(!['verify','submit'].includes(b.action))fail('Unknown action.');
  if(!b.id||!/^[a-f0-9]{64}$/.test(String(b.secret||'')))fail('Please request a new code.',403);
  const record=await db.QuoteEmailVerification.get(b.id).catch(()=>null);
  if(!record||record.email!==email||record.secret_hash!==await hash(b.secret)||!record.sent)fail('Please request a new code.',403);
  if(b.action==='verify'){
   if(record.lead_id)fail('This verification has already been used.',409);
   if(Date.parse(record.expires_at)<=now)fail('Your code expired. Please request a new one.',410);
   if(!/^\d{6}$/.test(String(b.code||'')))fail('Enter the six-digit code from your email.');
   await db.QuoteEmailAttempt.create({verification_id:record.id});
   const attempts=await db.QuoteEmailAttempt.filter({verification_id:record.id},'-created_date',6);
   if(attempts.length>5)fail('Too many attempts. Please request a new code.',429);
   if(record.code_hash!==await hash(b.secret+':'+b.code))fail('That code does not match. Please check your email.');
   await db.QuoteEmailVerification.update(record.id,{verified_until:new Date(now+3600000).toISOString()});
   return Response.json({verified:true});
  }
  if(!record.verified_until||Date.parse(record.verified_until)<=now)fail('Please verify your email again. Your form details are still here.',403);
  const prior=await db.Lead.filter({email_verification_id:record.id},'-created_date',1);
  if(prior[0])return Response.json({id:prior[0].id,booking_token:prior[0].booking_token});
  const input=b.lead||{},data:any={};
  const fields=['name','phone','business_name','business_type','website','quick_pitch','problem_to_solve','existing_tools','design_style','design_inspiration','ideal_launch_date','budget_range'];
  for(const key of fields)data[key]=String(input[key]||'').slice(0,key==='quick_pitch'||key==='problem_to_solve'?5000:1000);
  if(!data.name.trim()||data.quick_pitch.trim().length<5||!['under_1500','1500_3000','3000_5000','5000_8000','8000_plus','not_sure'].includes(data.budget_range))fail('Please complete your name, idea and budget.');
  for(const key of ['must_have_features','nice_to_have_features','integrations_needed'])data[key]=Array.isArray(input[key])?input[key].slice(0,30).map((v:any)=>String(v).slice(0,150)):[];
  data.selected_package=['Business Website','Custom Application','Mobile App','Not sure'].includes(input.selected_package)?input.selected_package:'Not sure';
  data.ongoing_support_needed=input.ongoing_support_needed===true;
  const pricing=(await db.PricingSettings.list('-updated_date',1).catch(()=>[]))[0];
  const estimate=estimateProject({mustHave:data.must_have_features,niceToHave:data.nice_to_have_features,integrations:data.integrations_needed,rate:pricing?.rate_per_hour});
  Object.assign(data,{estimated_tier:estimate.tier,estimated_hours_low:estimate.hoursLow,estimated_hours_high:estimate.hoursHigh,estimated_price_low:estimate.priceLow,estimated_price_high:estimate.priceHigh});
  if(data.selected_package==='Business Website')Object.assign(data,{estimated_tier:'starter',estimated_price_low:650,estimated_price_high:null,estimated_hours_low:null,estimated_hours_high:null});
  const token=hex(crypto.getRandomValues(new Uint8Array(32)));
  const lead=await db.Lead.create({...data,email,booking_token:token,interested_apps:['service_inquiry'],source:'get_quote_form',request_type:'quote_request',status:'new',email_verified_at:new Date(now).toISOString(),email_verification_id:record.id});
  await db.QuoteEmailVerification.update(record.id,{lead_id:lead.id});
  return Response.json({id:lead.id,booking_token:token});
 }catch(e){return Response.json({error:e.status?e.message:'Something went wrong. Please try again; your form details have not been cleared.'},{status:e.status||500});}
}
