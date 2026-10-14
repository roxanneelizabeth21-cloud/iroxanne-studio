import { ArrowRight, ArrowUpRight } from 'lucide-react';
export default function Hero({ projects, loading }) {
 const project = projects?.find(p=>p.slug==='tyla-aadam-shoe-co') || projects?.[0];
 return <section className="studio-hero">
  <div className="studio-wrap studio-hero-grid">
   <div>
    <p className="studio-eyebrow">A small studio. A world of possibilities.</p>
    <h1>Have an idea?<br/>Let’s make it <em>happen.</em></h1>
    <p className="studio-lead">A website you’re proud to share. An app you’ve been imagining. A little more ease in your everyday.</p>
    <p className="studio-note">I’m Roxanne. You don’t have to figure it all out before we talk.</p>
    <div className="studio-actions"><a className="studio-button" href="/quote">Let’s talk about your idea <ArrowRight size={17}/></a><a className="studio-text-link" href="#work">Explore my work <ArrowUpRight size={17}/></a></div>
   </div>
   <div className="studio-hero-art">
    <span className="studio-orbit" aria-hidden="true"/>
    {project ? <a className="studio-preview" href={'/work/'+project.slug}>
     <div className="studio-browser-bar"><span aria-hidden="true">● ● ●</span><span>Ideas brought to life</span><ArrowUpRight size={15}/></div>
     <img src={project.cover_image_url} alt={project.title+' — project preview'} fetchPriority="high"/>
     <div className="studio-preview-caption"><span>{project.title}</span><span>Explore the project ↗</span></div>
    </a> : <div className="studio-preview studio-art-placeholder" role="status">{loading?'Gathering a little inspiration…':'Your next chapter starts with an idea.'}</div>}
    <div className="studio-glass-note"><span aria-hidden="true">✦</span> Thoughtfully made.<br/><strong>Personally yours.</strong></div>
   </div>
  </div>
  <div className="studio-wrap studio-hero-foot"><span>Websites</span><span aria-hidden="true">✦</span><span>Custom web apps</span><span aria-hidden="true">✦</span><span>AI & automation</span></div>
 </section>;
}
