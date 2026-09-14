import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { resolveMedia, publishTargets, platformResult, platformError } from '@/lib/postValidation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function MarketingHub() {
 const qc=useQueryClient();
 const [tab,setTab]=useState('review');
 const [action,setAction]=useState(null);
 const [reason,setReason]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const {data:posts=[],isLoading,isError}=useQuery({queryKey:['marketing-posts'],queryFn:()=>base44.entities.MarketingPost.list('-created_date',1000)});
 const {data:clips=[]}=useQuery({queryKey:['clip-assets'],queryFn:()=>base44.entities.ClipAsset.list('-created_date',1000)});
 const active=posts.filter(p=>!['Cancelled','Skipped'].includes(p.status));
 const attention=p=>['Failed','Partially Published'].includes(p.status)||publishTargets(p).some(t=>['Failed','Connection Required','Permission Required'].includes(platformResult(p,t)));
 const ready=p=>resolveMedia(p,clips)&&publishTargets(p).length&&publishTargets(p).every(t=>String(p.create_post_state?.platformCaptions?.[t.toLowerCase()]??p.caption??'').trim());
 const groups={
   review:active.filter(p=>!attention(p)&&!['Posted','Publishing'].includes(p.status)&&p.publishing_status!=='Publishing'&&!(p.status==='Scheduled'&&p.approval_status==='Approved'&&p.publish_mode==='auto')&&ready(p)),
   scheduled:active.filter(p=>!attention(p)&&((p.status==='Scheduled'&&p.approval_status==='Approved'&&p.publish_mode==='auto')||p.status==='Publishing'||p.publishing_status==='Publishing')),
   results:active.filter(p=>p.status==='Posted'||attention(p))
 };
 const incomplete=active.filter(p=>!ready(p)&&!attention(p)&&!['Posted','Publishing','Scheduled'].includes(p.status));
 const saveFeedback=async()=>{
   if(!reason.trim()) return;
   setBusy(true);setError('');
   try{
     const current=await base44.entities.MarketingPost.get(action.post.id);
     if(['Posted','Publishing','Partially Published'].includes(current.status)||current.publishing_status==='Publishing') throw new Error('This post has already started publishing. Refresh to see its delivery status.');
     await base44.entities.MarketingPost.update(current.id,{
       status:action.kind==='reject'?'Skipped':'Pending Review',approval_status:'Pending Review',publish_mode:'manual',
       admin_notes:((current.admin_notes||'')+'\n'+new Date().toISOString()+' '+(action.kind==='reject'?'REJECTED: ':'CHANGES REQUESTED: ')+reason.trim()).slice(-1000)
     });
     await qc.invalidateQueries({queryKey:['marketing-posts']});setAction(null);setReason('');
   }catch(e){setError(e.message);}finally{setBusy(false);}
 };
 return <div className="space-y-5">
   <div><h1 className="font-display text-3xl">Your marketing</h1><p className="mt-2 text-muted-foreground">Review the finished content below. Nothing new goes out without your approval.</p></div>
   <nav aria-label="Post status" className="flex flex-wrap gap-2">{[['review','Needs approval'],['scheduled','Scheduled'],['results','Published / Needs attention']].map(([key,label])=><Button key={key} variant={tab===key?'default':'outline'} onClick={()=>setTab(key)} aria-pressed={tab===key}>{label} ({groups[key].length})</Button>)}</nav>
   {isLoading?<p>Loading your posts…</p>:isError?<p role="alert">Posts could not be loaded. Please refresh.</p>:groups[tab].length===0?<div className="rounded-2xl border p-6"><p>{tab==='review'?'No finished posts are waiting for approval.':tab==='scheduled'?'Nothing is scheduled yet.':'No published posts or delivery problems yet.'}</p></div>:null}
   <div className="grid gap-5 xl:grid-cols-2">{groups[tab].map(p=>{
     const media=resolveMedia(p,clips);
     return <article key={p.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
       <h2 className="font-medium">{p.hook||'Your next story'}</h2>
       {media&&(media.type==='video'?<video controls preload="metadata" src={media.url} className="w-full max-h-80 rounded-xl" />:<img src={media.url} alt="Post graphic" className="w-full max-h-80 object-contain rounded-xl" />)}
       {publishTargets(p).map(t=><section key={t} className="space-y-1"><h3 className="text-sm font-semibold">{t}</h3><p className="whitespace-pre-wrap break-words text-sm">{p.create_post_state?.platformCaptions?.[t.toLowerCase()]??p.caption}</p>{p.hashtags&&<p className="text-sm">{p.hashtags}</p>}{tab!=='review'&&<p className="text-sm text-muted-foreground">{platformResult(p,t)}</p>}{platformError(p,t)&&<p className="text-sm text-destructive">{platformError(p,t)}</p>}</section>)}
       {p.scheduled_date&&<p className="text-sm text-muted-foreground">{tab==='review'?'Suggested date':'Scheduled'}: {p.scheduled_date} {p.scheduled_time} ({p.scheduled_timezone||'America/New_York'})</p>}
       {p.admin_notes&&<details><summary className="text-sm cursor-pointer">Your feedback</summary><p className="text-sm whitespace-pre-wrap">{p.admin_notes}</p></details>}
       <div className="flex flex-wrap gap-2"><Button asChild><Link to={'/marketing/post/'+p.id}>{tab==='review'?'Review & approve':tab==='scheduled'?'View schedule':'View details'}</Link></Button>
       {tab==='review'&&<><Button variant="outline" onClick={()=>{setAction({post:p,kind:'changes'});setReason('');setError('');}}>Request changes</Button><Button variant="ghost" onClick={()=>{setAction({post:p,kind:'reject'});setReason('');setError('');}}>Reject</Button></>}</div>
     </article>;
   })}</div>
   <details className="rounded-xl border p-4"><summary className="cursor-pointer font-medium">Create &amp; tools {incomplete.length?('— '+incomplete.length+' unfinished drafts'):''}</summary>
     <div className="flex flex-wrap gap-3 py-4">{[['strategist','Ask the strategist'],['calendar','Calendar & backlog'],['post','Create a post'],['media','Media library'],['controls','Automation & settings'],['brand','Brand settings'],['library','All posts & rejected drafts'],['performance','Results']].map(([path,label])=><Link key={path} className="underline text-sm" to={'/marketing/'+path}>{label}</Link>)}</div>
     {incomplete.length>0&&<p className="text-sm text-muted-foreground">Unfinished drafts need a graphic, video or caption before they appear for approval.</p>}
   </details>
   <Dialog open={!!action} onOpenChange={open=>{if(!open&&!busy)setAction(null);}}><DialogContent><DialogHeader><DialogTitle>{action?.kind==='reject'?'Reject this post':'What should change?'}</DialogTitle><DialogDescription>Your feedback is saved with the post. It will not be published or deleted. Revisions still need to be made before you review it again.</DialogDescription></DialogHeader>
     <Textarea aria-label="Feedback" value={reason} maxLength={700} onChange={e=>setReason(e.target.value)} placeholder="Tell the strategist what missed the mark." />
     {error&&<p role="alert" className="text-destructive">{error}</p>}
     <Button disabled={busy||!reason.trim()} onClick={saveFeedback}>{busy?'Saving…':'Save feedback'}</Button>
   </DialogContent></Dialog>
 </div>;
}
