import { useState } from 'react';
import { Globe2, Layers, Sparkles, Lightbulb, ArrowRight } from 'lucide-react';
const choices=[
 {icon:Globe2,label:'A beautiful website',title:'Make your corner of the internet feel like you.',copy:'A welcoming home for your business, your work, and the people you want to reach.',examples:'Think: a creative portfolio, a boutique storefront, or a fresh start for your business.',link:'/work/tyla-aadam-shoe-co',project:'Explore Tyla Aadam Shoe Co.'},
 {icon:Layers,label:'My own app',title:'That “what if” could become something useful.',copy:'A custom web app built around your idea and the people who will use it.',examples:'Think: a space to connect, a client portal, or one place to organize everyday work.',link:'/work/bonded',project:'Explore Bonded'},
 {icon:Sparkles,label:'AI & automation',title:'Make a little room in your day.',copy:'Let’s explore how smart tools could help with the repetitive parts of your work.',examples:'Think: a helpful planning tool, a first draft to review, or a smoother follow-up process.',link:'/work/booked-now-what',project:'Explore Booked! Now What?'},
 {icon:Lightbulb,label:'I’m still exploring',title:'You don’t need a finished plan.',copy:'Bring the idea, the question, or the task you wish were easier. We’ll find a starting point together.',examples:'A conversation is a perfectly good place to begin.',link:'/ideas',project:'Browse the possibilities'}
];
export default function Services(){
 const [selected,setSelected]=useState(0); const choice=choices[selected];
 return <section id="services" className="studio-section studio-discovery"><div className="studio-wrap">
  <p className="studio-eyebrow">Start with a possibility</p><h2>What would you love to create?</h2>
  <p className="studio-subtitle">Pick what’s on your mind. There’s no wrong place to start.</p>
  <div className="studio-choice-grid" aria-label="Explore services">{choices.map(({icon:Icon,label},i)=><button type="button" key={label} aria-pressed={selected===i} aria-controls="service-detail" onClick={()=>setSelected(i)} className={'studio-choice '+(selected===i?'is-selected':'')}><Icon size={23} aria-hidden="true"/><span>{label}</span><ArrowRight size={17} aria-hidden="true"/></button>)}</div>
  <div id="service-detail" className="studio-service-detail" aria-live="polite" aria-atomic="true"><div><h3>{choice.title}</h3><p>{choice.copy}</p><p className="studio-service-example">{choice.examples}</p></div><div className="studio-service-actions"><a className="studio-button" href="/quote">Let’s explore it <ArrowRight size={16}/></a><a className="studio-text-link" href={choice.link}>{choice.project} ↗</a></div></div>
 </div></section>;
}
