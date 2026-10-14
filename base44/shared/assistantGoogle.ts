export const STUDIO_EMAIL='roxanne@iroxannestudio.com';
export const ASSISTANT_BCC='roxanneelizabeth21@gmail.com';
export const emailValid=(s:any)=>typeof s==='string'&&/^[a-z0-9.!#$%&'*+\-/=?^_`{|}~]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)&&s.length<=254;
export const emailAddress=(v:any)=>String(v||'').match(/<([^<>\s]+@[^<>\s]+)>/)?.[1]?.toLowerCase()||String(v||'').trim().toLowerCase();
const clean=(s:any,n=10000)=>String(s||'').replace(/\u0000/g,'').slice(0,n);
export async function googleConnection(client:any,kind:'gmail'|'googlecalendar') {
 const {accessToken}=await client.asServiceRole.connectors.getConnection(kind);
 if(!accessToken)throw Error('Reconnect '+kind+' for '+STUDIO_EMAIL+'.');
 const root=kind==='gmail'?'https://gmail.googleapis.com/gmail/v1/users/me/':'https://www.googleapis.com/calendar/v3/';
 const call=async(path:string,options:any={})=>{
  const res=await fetch(root+path,{...options,signal:AbortSignal.timeout(20000),headers:{Authorization:'Bearer '+accessToken,'Content-Type':'application/json',...options.headers}});
  const result=res.status===204?{}:await res.json().catch(()=>({}));
  if(!res.ok){const e:any=Error(res.status===403?'The '+kind+' connection needs permission. Check the connected account in Base44.':res.status===412?'This event changed. Refresh before trying again.':'Could not complete the '+kind+' request ('+res.status+').');e.status=res.status;throw e;}
  return result;
 };
 const profile=await call(kind==='gmail'?'profile':'calendars/primary');
 const address=kind==='gmail'?profile.emailAddress:profile.id;
 if(String(address).toLowerCase()!==STUDIO_EMAIL)throw Error('Connect '+STUDIO_EMAIL+' before using the assistant.');
 return call;
}
export function decodeBody(payload:any):string {
 const decode=(s:string)=>{try{const raw=atob(s.replace(/-/g,'+').replace(/_/g,'/'));return new TextDecoder().decode(Uint8Array.from(raw,c=>c.charCodeAt(0)));}catch{return '';}};
 const parts:any[]=[];
 const visit=(p:any)=>{if(p?.filename)return;if(p?.body?.data)parts.push({type:p.mimeType,text:decode(p.body.data)});for(const c of p?.parts||[])visit(c);};visit(payload);
 const plain=parts.filter(p=>p.type==='text/plain').map(p=>p.text).join('\n');
 return clean(plain||parts.filter(p=>p.type==='text/html').map(p=>p.text.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')).join('\n'),6000);
}
export function summarizeThread(thread:any) {
 const messages=(thread.messages||[]).slice(-8).map((m:any)=>{
  const h=Object.fromEntries((m.payload?.headers||[]).map((x:any)=>[String(x.name).toLowerCase(),String(x.value)]));
  return {id:m.id,bulk:!!(h['list-unsubscribe']||h['list-id']||/bulk|list/i.test(h.precedence||'')),from:clean(h.from,300),from_email:emailAddress(h.from),to:clean(h.to,400),subject:clean(h.subject,300),date:new Date(Number(m.internalDate)||0).toISOString(),body:decodeBody(m.payload)||clean(m.snippet,1000),message_id:clean(h['message-id'],500),references:clean(h.references,2000),unread:(m.labelIds||[]).includes('UNREAD')};
 });
 const latest=messages.at(-1)||{};return {id:thread.id,subject:latest.subject||'(No subject)',bulk:!!latest.bulk,snippet:clean(latest.body,240),latest_from:latest.from,latest_from_email:latest.from_email,date:latest.date,unread:messages.some((m:any)=>m.unread),awaiting_reply:latest.from_email!==STUDIO_EMAIL,messages,url:'https://mail.google.com/mail/u/'+encodeURIComponent(STUDIO_EMAIL)+'/#all/'+encodeURIComponent(thread.id)};
}
export async function readInbox(client:any,email='') {
 const call=await googleConnection(client,'gmail');
 if(email&&!emailValid(email))throw Error('Choose a valid client email.');
 const query=email?'newer_than:365d {from:'+email+' to:'+email+'} -in:trash -in:spam':'newer_than:90d {in:inbox in:sent} -category:promotions -category:social -in:trash -in:spam';
 const list=await call('threads?maxResults=20&q='+encodeURIComponent(query));
 const threads:any[]=[];let failed=0;
 // Small batches keep Gmail requests bounded.
 for(let i=0;i<(list.threads||[]).length;i+=5){const batch=await Promise.allSettled(list.threads.slice(i,i+5).map((t:any)=>call('threads/'+encodeURIComponent(t.id)+'?format=full')));for(const r of batch){if(r.status==='fulfilled')threads.push(summarizeThread(r.value));else failed++;}}
 return {connected:true,account:STUDIO_EMAIL,threads,limited:!!list.nextPageToken,failed,coverage:email?'Up to 20 recent threads with this client from the past year; last 8 messages per thread.':'Up to 20 recent inbox/sent threads from the past 90 days, excluding promotions and social categories; last 8 messages per thread.'};
}
export async function readCalendar(client:any,days=21) {
 const call=await googleConnection(client,'googlecalendar');
 const now=new Date(),params=new URLSearchParams({timeMin:now.toISOString(),timeMax:new Date(now.getTime()+days*86400000).toISOString(),singleEvents:'true',orderBy:'startTime',maxResults:'100'});
 const result=await call('calendars/primary/events?'+params);
 return {connected:true,account:STUDIO_EMAIL,limited:!!result.nextPageToken,events:(result.items||[]).filter((e:any)=>e.status!=='cancelled').map((e:any)=>({id:e.id,title:clean(e.summary,200)||'Appointment',start:e.start?.dateTime||e.start?.date,end:e.end?.dateTime||e.end?.date,all_day:!e.start?.dateTime,description:clean(e.description,1800),attendees:(e.attendees||[]).map((a:any)=>String(a.email||'').toLowerCase()),lead_id:e.extendedProperties?.private?.lead_id||'',url:e.htmlLink||'https://calendar.google.com/calendar/u/'+encodeURIComponent(STUDIO_EMAIL)+'/r',etag:e.etag})),coverage:'Primary calendar, next '+days+' days; up to 100 events.'};
}
const encode=(s:string)=>btoa(Array.from(new TextEncoder().encode(s),b=>String.fromCharCode(b)).join(''));
export async function sendAssistantReply(client:any,item:any) {
 if(!emailValid(item.recipient)||!item.subject?.trim()||!item.body?.trim())throw Error('Recipient, subject and message are required.');
 const call=await googleConnection(client,'gmail');
 const payload=JSON.parse(item.payload_json||'{}');let replyHeaders='',threadId='';
 if(payload.thread_id){
  const raw=await call('threads/'+encodeURIComponent(payload.thread_id)+'?format=full');
  const thread=summarizeThread(raw),last=thread.messages.at(-1);
  if(!last||last.id!==payload.last_message_id)throw Error('This conversation has a newer message. Refresh the inbox and prepare a fresh reply.');
  if(last.from_email===STUDIO_EMAIL)throw Error('You have already replied to this conversation. Review it in Gmail first.');
  if(item.recipient.toLowerCase()!==last.from_email)throw Error('This reply must go to the sender shown in the source email. Create a separate message for another recipient.');
  if(/[\r\n]/.test(last.message_id+last.references))throw Error('The original email has invalid reply headers. Reply in Gmail.');
  if(last.message_id){replyHeaders='In-Reply-To: '+last.message_id+'\r\nReferences: '+[last.references,last.message_id].filter(Boolean).join(' ')+'\r\n';threadId=thread.id;}
 }
 const raw='From: Roxanne <'+STUDIO_EMAIL+'>\r\nTo: '+item.recipient+'\r\nBcc: '+ASSISTANT_BCC+'\r\nSubject: =?UTF-8?B?'+encode(item.subject.replace(/[\r\n]/g,' ').slice(0,300))+'?=\r\n'+replyHeaders+'Message-ID: <studio-assistant-'+item.id+'@iroxannestudio.com>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n'+encode(item.body);
 const result=await call('messages/send',{method:'POST',body:JSON.stringify({raw:encode(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),...(threadId?{threadId}:{})})});
 if(!result.id)throw Error('Gmail delivery could not be confirmed. Check Sent mail before retrying.');return {message_id:result.id,thread_id:result.threadId,bcc:ASSISTANT_BCC};
}
