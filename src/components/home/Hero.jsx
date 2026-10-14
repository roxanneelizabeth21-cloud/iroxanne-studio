import { ArrowRight, ArrowUpRight } from 'lucide-react';
export default function Hero({ projects, loading }) {
 const project = projects?.find(p=>p.slug==='quiet-time-daily') || projects?.[0];
 return <section className="studio-hero">
  <div className="studio-wrap studio-hero-grid">
   <div>
    <p className="studio-eyebrow">A small studio. A world of possibilities.</p>
    <h1>Have an idea?<br/>Let’s make it <em>happen.</em></h1>
    <p className="studio-lead">A website, an app, a creative tool—or something entirely your own. Let’s see what your idea could become.</p>
    <p className="studio-note">I’m Roxanne. Bring the idea, even if you don’t know what to call it yet.</p>
    <div className="studio-actions"><a className="studio-button" href="#possibilities">Explore your possibilities <ArrowRight size={17}/></a><a className="studio-text-link" href="#work">Explore my work <ArrowUpRight size={17}/></a></div>
   </div>
   <div className="studio-hero-art">
    <span className="studio-orbit" aria-hidden="true"/>
    {project ? <a className="studio-preview" href={'/ideas?seed='+project.slug+'#possibilities'}>
     <div className="studio-browser-bar"><span aria-hidden="true">● ● ●</span><span>Ideas brought to life</span><ArrowUpRight size={15}/></div>
     <img src={project.cover_image_url} alt={project.title+' — project preview'} fetchPriority="high"/>
     <div className="studio-preview-caption"><span>{project.title}</span><span>Imagine something like this ↗</span></div>
    </a> : <div className="studio-preview studio-art-placeholder" role="status">{loading?'Gathering a little inspiration…':'Your next chapter starts with an idea.'}</div>}
    <div className="studio-glass-note"><span aria-hidden="true">✦</span> Thoughtfully made.<br/><strong>Personally yours.</strong></div>
   </div>
  </div>
  <div className="studio-wrap studio-hero-foot"><span>Websites & apps</span><span aria-hidden="true">✦</span><span>Creative tools</span><span aria-hidden="true">✦</span><span>Your next idea</span></div>
 </section>;
}
