import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
export default function ProductionControls(){
 const qc=useQueryClient();const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const {data:rows=[]}=useQuery({queryKey:['marketing-automation'],queryFn:()=>base44.entities.MarketingAutomation.list()});
 const {data:jobs=[]}=useQuery({queryKey:['marketing-production'],queryFn:()=>base44.entities.MarketingProduction.list('-created_date',12)});
 const cfg=rows[0];
 const update=async(patch)=>{setBusy(true);setError('');try{await base44.entities.MarketingAutomation.update(cfg.id,patch);qc.invalidateQueries({queryKey:['marketing-automation']});}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <section className="rounded-xl border p-4 space-y-3"><h2 className="font-display text-xl">Automatic content production</h2>
 <p className="text-sm text-muted-foreground">Four weekly stories, each with Facebook and Instagram captions and a finished graphic. Up to three attempts per story. New content appears in your planner.</p>
 <p className="text-sm">Production: {cfg?.enabled?'Enabled':'Paused'} · Publishing: {cfg?.auto_publish?'Automatic after quality checks':'Review first'}</p>
 {cfg && <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={()=>update({enabled:!cfg.enabled})}>{cfg.enabled?'Pause production':'Enable production'}</Button><Button variant="outline" disabled={busy} onClick={()=>update({auto_publish:!cfg.auto_publish})}>{cfg.auto_publish?'Require review for future posts':'Auto-publish future posts'}</Button></div>}
 <p className="text-xs text-muted-foreground">Enable automatic publishing only after confirming the destination accounts and testing delivery. These switches affect future production; existing scheduled posts stay on their current schedule.</p>
 {(error||cfg?.last_error) && <p role="alert" className="text-sm text-destructive">{error||cfg.last_error}</p>}
 <p className="text-xs text-muted-foreground">Last run: {cfg?.last_run?new Date(cfg.last_run).toLocaleString():'Not run yet'}</p>
 {jobs.map(j=><p key={j.id} className="text-sm">{j.scheduled_date}: {j.phase}{j.error?' — '+j.error:''}</p>)}
 </section>;
}
