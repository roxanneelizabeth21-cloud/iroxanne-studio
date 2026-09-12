export const defaultCallSettings = {enabled:false,timezone:'America/New_York',calendar_id:'primary',duration_minutes:30,buffer_minutes:15,notice_hours:24,horizon_days:21,weekly_hours:[1,2,3,4,5].map(day=>({day,start:'17:00',end:'19:30'})),blocked_dates:[]};
export function validateCallSettings(s:any) {
 try {new Intl.DateTimeFormat('en-US',{timeZone:s.timezone}).format();}catch{throw Error('Choose a valid time zone.');}
 for(const [key,min,max] of [['duration_minutes',15,120],['buffer_minutes',0,60],['notice_hours',1,168],['horizon_days',1,60]] as const){
  if(!Number.isInteger(s[key])||s[key]<min||s[key]>max)throw Error('Invalid '+key.replaceAll('_',' '));
 }
 if(s.duration_minutes%15||s.buffer_minutes%15)throw Error('Call length and breaks must use 15-minute increments.');
 if(!Array.isArray(s.weekly_hours)||s.weekly_hours.length>7)throw Error('Choose weekly availability.');
 const seen=new Set();
 for(const w of s.weekly_hours){
  if(!Number.isInteger(w.day)||w.day<0||w.day>6||seen.has(w.day)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(w.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(w.end)||w.start>=w.end||Number(w.start.slice(3))%15||Number(w.end.slice(3))%15)throw Error('Choose one valid time range per day in 15-minute increments.');
  seen.add(w.day);
 }
 if(s.enabled&&!s.weekly_hours.length)throw Error('Add available hours before enabling booking.');
 if(!Array.isArray(s.blocked_dates)||s.blocked_dates.length>366||s.blocked_dates.some((x:any)=>!/^\d{4}-\d{2}-\d{2}$/.test(x)))throw Error('Blocked dates must be YYYY-MM-DD.');
 return {...s,calendar_id:'primary'};
}
export function callSlots(s:any,busy:any[],now=Date.now()){
 const out:string[]=[];
 const formatter=new Intl.DateTimeFormat('en-US',{timeZone:s.timezone,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 const earliest=now+s.notice_hours*3600000,latest=now+s.horizon_days*86400000;
 for(let t=Math.ceil(earliest/900000)*900000;t<latest;t+=900000){
  const p=Object.fromEntries(formatter.formatToParts(t).map(x=>[x.type,x.value]));
  const date=p.year+'-'+p.month+'-'+p.day;
  if((s.blocked_dates||[]).includes(date))continue;
  const window=s.weekly_hours.find((w:any)=>w.day===days.indexOf(p.weekday));if(!window)continue;
  const minute=Number(p.hour)*60+Number(p.minute);
  const start=Number(window.start.slice(0,2))*60+Number(window.start.slice(3));
  const end=Number(window.end.slice(0,2))*60+Number(window.end.slice(3));
  if(minute<start||minute+s.duration_minutes>end||(minute-start)%(s.duration_minutes+s.buffer_minutes))continue;
  const finish=t+s.duration_minutes*60000,buffer=s.buffer_minutes*60000;
  if(busy.some(x=>t<Date.parse(x.end)+buffer&&finish+buffer>Date.parse(x.start)))continue;
  out.push(new Date(t).toISOString());
 }
 return out;
}
