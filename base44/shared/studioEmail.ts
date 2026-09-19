// Use the studio's existing Gmail connection for clients who are not app users.
export async function sendStudioEmail(base44, message: {to:string;subject:string;body:string;from_name?:string}) {
  const to=String(message.to||'').trim();
  if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(to)||/[\r\n]/.test(to))throw new Error('A valid recipient email is required.');
  if(!message.body||!message.subject)throw new Error('Email subject and body are required.');
  const {accessToken}=await base44.asServiceRole.connectors.getConnection('gmail');
  if(!accessToken)throw new Error('The Studio Gmail connection needs attention.');
  const headers={Authorization:'Bearer '+accessToken};
  const profileResponse=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile',{headers});
  const profile=await profileResponse.json();
  if(!profileResponse.ok||String(profile.emailAddress).toLowerCase()!=='roxanne@iroxannestudio.com')throw new Error('Connect roxanne@iroxannestudio.com before sending client messages.');
  const encode=(s:string)=>btoa(Array.from(new TextEncoder().encode(s),b=>String.fromCharCode(b)).join(''));
  const subject='=?UTF-8?B?'+encode(String(message.subject).replace(/[\r\n]/g,' ').slice(0,300))+'?=';
  const raw='From: iRoxanne Studio <roxanne@iroxannestudio.com>\r\nTo: '+to+'\r\nSubject: '+subject+'\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n'+encode(message.body);
  const response=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({raw:encode(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')})});
  if(!response.ok)throw new Error('Gmail did not accept the message. Check the connection and retry.');
  return response.json();
}
