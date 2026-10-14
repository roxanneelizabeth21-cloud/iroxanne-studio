import { ArrowRight, ArrowUpRight } from 'lucide-react';
export default function Hero() {
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
    <a className="studio-device-hero" href="/ideas?seed=hair#possibilities" aria-label="Explore a custom business website and app concept">
     <img src="/images/studio-device-hero.jpg" alt="Concept mockup: a laptop showing a business dashboard beside a phone showing its customer booking app" width="1200" height="800" fetchPriority="high"/>
     <div className="studio-device-caption"><span>A website for your customers. Tools for you.</span><ArrowUpRight size={17}/></div>
    </a>
    <p className="studio-device-label">Illustrative website & app concept</p>
   </div>
  </div>
  <div className="studio-wrap studio-hero-foot"><span>Websites & apps</span><span aria-hidden="true">✦</span><span>Creative tools</span><span aria-hidden="true">✦</span><span>Your next idea</span></div>
 </section>;
}
