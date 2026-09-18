import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SiteNav from '@/components/home/SiteNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Feedback() {
  const [params] = useSearchParams();
  const id=params.get('id'), token=params.get('t');
  const [state,setState]=useState('loading'), [error,setError]=useState('');
  const [quote,setQuote]=useState(''), [name,setName]=useState('');
  const [consent,setConsent]=useState(false), [anonymous,setAnonymous]=useState(false), [busy,setBusy]=useState(false);
  useEffect(()=>{
    let active=true;
    base44.functions.invoke('testimonialFeedback',{action:'get',id,token}).then(r=>{
      const d=r.data || r;
      if(active){ if(d.error){setError(d.error);setState('error');} else setState(d.submitted?'done':'form'); }
    }).catch(()=>{if(active){setError('This link could not be opened. Please contact Roxanne.');setState('error');}});
    return ()=>{active=false;};
  },[id,token]);
  async function submit(e){
    e.preventDefault();setBusy(true);setError('');
    try{
      const r=await base44.functions.invoke('testimonialFeedback',{action:'submit',id,token,quote,client_name:name,consent_to_publish:consent,client_anonymous:anonymous});
      const d=r.data || r;if(d.error)throw new Error(d.error);setState('done');
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  return <div className="min-h-screen bg-background text-foreground"><SiteNav/><main className="max-w-2xl mx-auto px-5 pt-24 pb-12">
    <h1 className="font-display text-4xl">Share your experience</h1>
    <p className="mt-4 text-muted-foreground">Thank you for working with me. I would love to hear what the experience was like for you. Honest feedback helps me improve.</p>
    {error&&<p role="alert" className="mt-5 text-destructive">{error}</p>}
    {state==='loading'&&<p className="mt-6">Opening your feedback form…</p>}
    {state==='done'&&<div role="status" className="mt-8 rounded-2xl border border-border bg-card p-6">Thank you for sharing. Your feedback has been received privately. Nothing is published automatically.</div>}
    {state==='form'&&<form onSubmit={submit} className="mt-8 space-y-6 rounded-2xl bg-card border border-border p-6">
      <label className="block space-y-2"><span>What were you hoping to create, and how was your experience working with me?</span><Textarea required maxLength={3000} rows={7} value={quote} onChange={e=>setQuote(e.target.value)}/></label>
      <label className="block space-y-2"><span>Name you would like displayed (optional)</span><Input maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
      <label className="flex gap-3 items-start"><input type="checkbox" checked={anonymous} onChange={e=>setAnonymous(e.target.checked)}/><span>Use “A recent client” instead of my name.</span></label>
      <label className="flex gap-3 items-start"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I give iRoxanne Studio permission to share these words and my chosen display name on its website and in studio marketing. This is optional; leave unchecked to keep my feedback private.</span></label>
      <p className="text-sm text-muted-foreground">Roxanne reviews every submission and chooses what to share. You can contact her to withdraw permission.</p>
      <Button disabled={busy} type="submit">{busy?'Sending…':'Send feedback privately'}</Button>
    </form>}
  </main></div>;
}