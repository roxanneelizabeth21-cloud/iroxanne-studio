import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SiteNav from '@/components/home/SiteNav';
import SiteFooter from '@/components/home/SiteFooter';
import CalendarPreview from '@/components/home/CalendarPreview';
import BusinessConcepts from '@/components/home/BusinessConcepts';

const EXAMPLES = [
  ['quiet-time-daily', 'Make space for a daily pause', 'Bring Scripture, prayer, and reflection into a welcoming place people can return to.'],
  ['booked-now-what', 'Make more of a trip', 'Turn a booked trip into a plan, with itineraries, packing lists, and travel details together.'],
  ['nestflow', 'Bring family life together', 'Keep family schedules, chores, meals, and everyday planning in one place.'],
];

export default function Ideas() {
  const [items,setItems]=useState(null);
  const [error,setError]=useState(false);
  useEffect(()=>{
    let active=true;
    base44.entities.PortfolioItem.list('sort_order',500).then(rows=>{
      if(active)setItems(rows);
    }).catch(()=>{if(active)setError(true);});
    return ()=>{active=false;};
  },[]);
  return <div className="studio-public min-h-screen bg-background text-foreground">
    <SiteNav/>
    <main className="pt-[72px]">
      <header className="bg-[#e6eee5] text-[#203d39] px-5 py-8 md:py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-[#756130] text-sm tracking-wide">Different ideas. Real possibilities.</p>
          <h1 className="font-display text-4xl md:text-5xl mt-4">Ideas brought to life</h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-[#4f665f]">An app can begin with a business, a shared challenge, or a simple “wouldn’t it be helpful if…” These projects show a few different starting points. Your idea does not need to look like any of them.</p>
        </div>
      </header>
      <BusinessConcepts />
      <section aria-label="App examples" className="max-w-5xl mx-auto px-5 md:px-8 py-8">
        {error?<p role="alert">The examples could not load. Please refresh to try again.</p>:!items?<p role="status">Loading examples…</p>:
          <div className="grid gap-5 md:grid-cols-2">{EXAMPLES.map(([slug,idea,description])=>{
            const app=items.find(item=>item.slug===slug);
            if(!app)return null;
            return <article key={slug} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-col gap-4 items-start">
                {app.cover_image_url&&<img src={app.cover_image_url} alt={app.title+' app preview'} loading="lazy" className="w-full aspect-[4/3] object-contain rounded-lg border border-border bg-[#edf0e8]"/>}
                <div className="min-w-0"><p className="text-sm text-muted-foreground">{app.title}</p><h2 className="font-display text-2xl mt-1">{idea}</h2></div>
              </div>
              <p className="mt-4 text-muted-foreground leading-relaxed">{description}</p>
              <Link to={'/work/'+slug} className="inline-flex items-center min-h-11 mt-3 font-semibold underline underline-offset-4">Explore this project<span className="sr-only">: {app.title}</span> →</Link>
            </article>;
          })}</div>}
      </section>
      <CalendarPreview />
      <section className="studio-section"><div className="studio-wrap"><p className="studio-eyebrow">And then there’s your idea</p><h2>What else could we create?</h2><p className="studio-subtitle">A creative studio. A learning space. An interactive guide. A tool for your community. Something no one has quite put a name to yet.</p><a className="studio-button mt-6" href="/quote">Tell me what you’re imagining →</a></div></section>
    </main>
    <SiteFooter/>
  </div>;
}