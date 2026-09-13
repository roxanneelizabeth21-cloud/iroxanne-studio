import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ContentCalendar from './ContentCalendar';
import { hasValidMedia, publishTargets, platformResult } from '@/lib/postValidation';
import { dateKey } from '@/lib/marketing';

export default function MarketingHub() {
 const {data:posts=[]}=useQuery({queryKey:['marketing-posts'],queryFn:()=>base44.entities.MarketingPost.list('-created_date')});
 const {data:clips=[]}=useQuery({queryKey:['clip-assets'],queryFn:()=>base44.entities.ClipAsset.list('-created_date')});
 const today=dateKey(new Date());
 const open=posts.filter(p=>!['Posted','Cancelled','Skipped'].includes(p.status));
 const attention=open.map(p=>{
  const failed=publishTargets(p).filter(t=>['Failed','Connection Required','Permission Required'].includes(platformResult(p,t)));
  const reason=failed.length ? failed.join(' and ')+' needs attention' : p.status==='Scheduled' && p.scheduled_date<today ? 'Planned date has passed; check publishing' : !hasValidMedia(p,clips) ? 'Add a graphic or video' : !p.caption?.trim() ? 'Add a caption' : p.approval_status!=='Approved' ? 'Ready for your review' : '';
  return {p,reason};
 }).filter(x=>x.reason);
 return <div className="space-y-5">
  <div><h1 className="font-display text-3xl">What are we posting?</h1><p className="text-muted-foreground mt-2">Plan four weekly stories for Facebook and Instagram. Review the words and graphics, then choose when to publish.</p></div>
  <nav aria-label="Marketing sections" className="flex flex-wrap gap-3 text-sm">
   <span className="font-semibold border-b-2 border-primary">This week & backlog</span>
   {[['/marketing/media','Media'],['/marketing/performance','Results'],['/marketing/brand','Settings']].map(([to,label])=><Link key={to} to={to} className="underline">{label}</Link>)}
   <details><summary className="cursor-pointer">More tools</summary><div className="flex flex-wrap gap-3 py-3">{[['campaigns','Campaigns'],['canvas','Case study graphics'],['templates','Templates'],['clips','Clips'],['controls','Automation'],['meta-ads','Ads'],['library','All posts']].map(([to,label])=><Link key={to} to={'/marketing/'+to}>{label}</Link>)}</div></details>
  </nav>
  <div className="flex flex-wrap gap-3"><Link className="rounded-xl bg-primary text-primary-foreground px-4 py-3" to="/marketing/strategist?weekly=1">Create this week's posts with the strategist</Link><Link className="rounded-xl border px-4 py-3" to="/marketing/post">Create a post myself</Link></div>
  <details className="rounded-xl border p-4" open={attention.length>0}><summary className="cursor-pointer font-medium">Needs attention ({attention.length})</summary>
   <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">{attention.map(({p,reason})=><Link key={p.id} to={'/marketing/post/'+p.id} className="rounded-lg border p-3"><p className="font-medium line-clamp-1">{p.hook||p.caption||'Untitled post'}</p><p className="text-sm text-muted-foreground">{reason} →</p><p className="text-xs mt-2">{publishTargets(p).map(t=>t+': '+(platformResult(p,t)==='Not Selected'?'Not published':platformResult(p,t))).join(' · ')}</p></Link>)}</div>
  </details>
  <p className="text-sm text-muted-foreground">Dragging sets a planned date only. Approval and publishing are separate. Open a post to review both platforms. Published posts remain locked.</p>
  <ContentCalendar planner />
 </div>;
}
