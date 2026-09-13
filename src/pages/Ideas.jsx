import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SiteNav from '@/components/home/SiteNav';
import SiteFooter from '@/components/home/SiteFooter';

const EXAMPLES = [
  ['booked-now-what', 'Make more of a trip', 'Turn a booked trip into a plan, with itineraries, packing lists, and travel details together.'],
  ['bonded', 'Make space for connection', 'Help couples connect through daily check-ins, shared goals, and guided activities.'],
  ['nestflow', 'Bring family life together', 'Keep family schedules, chores, meals, and everyday planning in one place.'],
  ['creatively-his-event-staging', 'Turn inquiries into events', 'Help an event business manage requests, proposals, agreements, and payments.'],
  ['tyla-aadam-shoe-co', 'Bring a collection to customers', 'Give a footwear brand a storefront with shopping, pre-orders, and tools to manage the business.'],
  ['nhd-customs', 'Make custom orders easier', 'Organize personalized jewelry requests from the first inspiration photo through delivery.'],
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
  return <div className="min-h-screen bg-background text-foreground">
    <SiteNav/>
    <main className="pt-[72px]">
      <header className="bg-[#302634] text-[#FAF3E5] px-5 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-[#D5BB82] text-sm tracking-wide">Different ideas. Real possibilities.</p>
          <h1 className="font-display text-4xl md:text-5xl mt-4">Ideas brought to life</h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-[#E4DCE2]">An app can begin with a business, a shared challenge, or a simple “wouldn’t it be helpful if…” These projects show a few different starting points. Your idea does not need to look like any of them.</p>
        </div>
      </header>
      <section aria-label="App examples" className="max-w-5xl mx-auto px-5 md:px-8 py-12">
        {error?<p role="alert">The examples could not load. Please refresh to try again.</p>:!items?<p role="status">Loading examples…</p>:
          <div className="grid gap-5 md:grid-cols-2">{EXAMPLES.map(([slug,idea,description])=>{
            const app=items.find(item=>item.slug===slug);
            if(!app)return null;
            return <article key={slug} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex gap-4 items-start">
                {app.cover_image_url&&<img src={app.cover_image_url} alt={app.title+' app preview'} loading="lazy" className="w-24 h-20 sm:w-32 sm:h-24 object-cover rounded-lg shrink-0 border border-border"/>}
                <div className="min-w-0"><p className="text-sm text-muted-foreground">{app.title}</p><h2 className="font-display text-2xl mt-1">{idea}</h2></div>
              </div>
              <p className="mt-4 text-muted-foreground leading-relaxed">{description}</p>
              <Link to={'/work/'+slug} className="inline-flex items-center min-h-11 mt-3 font-semibold underline underline-offset-4">Explore this project<span className="sr-only">: {app.title}</span> →</Link>
            </article>;
          })}</div>}
      </section>
    </main>
    <SiteFooter/>
  </div>;
}
