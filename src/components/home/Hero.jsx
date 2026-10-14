import { ArrowRight, ArrowUpRight } from 'lucide-react';
export default function Hero({ projects, loading }) {
 const project = projects?.find(p=>p.slug==='quiet-time-daily') || projects?.[0];
 return <section className="studio-hero">
  <div className="studio-wrap studio-hero-grid">
   <div>
    <p className="studio-eyebrow">Custom websites & apps · Built by Roxanne</p>
    <h1>A website that welcomes.<br/>An app that <em>works for you.</em></h1>
    <p className="studio-lead">I design and build custom websites and apps for small businesses and people with an idea.</p>
    <p className="studio-note">I’m Roxanne. We’ll figure out what you need, then bring it to life—together.</p>
    <div className="studio-actions"><a className="studio-button" href="#business-concepts">Explore what we could build <ArrowRight size={17}/></a><a className="studio-text-link" href="/contact">Talk with Roxanne <ArrowUpRight size={17}/></a></div>
   </div>
   <div className="studio-hero-art">
    <span className="studio-orbit" aria-hidden="true"/>
    {project ? <a className="studio-preview" href={'/ideas?seed='+project.slug+'#possibilities'}>
     <div className="studio-browser-bar"><span aria-hidden="true">● ● ●</span><span>An example of my design & development work</span><ArrowUpRight size={15}/></div>
     <img src={project.cover_image_url} alt={project.title+' — project preview'} fetchPriority="high"/>
     <div className="studio-preview-caption"><span>Portfolio · {project.title}</span><span>Imagine something like this ↗</span></div>
    </a> : <div className="studio-preview studio-art-placeholder" role="status">{loading?'Gathering a little inspiration…':'Your next chapter starts with an idea.'}</div>}
    <div className="studio-glass-note"><span aria-hidden="true">✦</span> Thoughtfully made.<br/><strong>Personally yours.</strong></div>
   </div>
  </div>
  <div className="studio-wrap studio-hero-foot"><span>Websites & apps</span><span aria-hidden="true">✦</span><span>Creative tools</span><span aria-hidden="true">✦</span><span>Your next idea</span></div>
 </section>;
}
