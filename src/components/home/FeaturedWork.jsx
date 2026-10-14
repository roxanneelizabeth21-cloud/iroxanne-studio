import { Link } from 'react-router-dom';
const examples={
 'quiet-time-daily':['A welcoming content library','Quiet Time Daily','An example of presenting readings and resources in a calm, easy-to-explore website.'],
 'booked-now-what':['A guided planning experience','Booked! Now What?','An example of organizing an app around a person’s next step and the information they need.'],
 nestflow:['An organized everyday workspace','NestFlow','An example of bringing related tasks and planning into one clear interface.']
};
export default function FeaturedWork({items,loading}){
 return <section id="work" className="studio-section studio-work" aria-label="Examples of my work"><div className="studio-wrap">
 <div className="studio-section-heading"><div><p className="studio-eyebrow">Design & development by Roxanne</p><h2>Examples of my work.</h2></div><p className="studio-calendar-intro">A few projects that show how I turn different ideas into useful experiences. Your project will be built around you.</p></div>
 {loading?<p role="status">Loading work examples…</p>:<div className="studio-project-grid studio-ideas-grid">{(items||[]).filter(p=>examples[p.slug]).map(item=>{const [title,name,description]=examples[item.slug];return <article key={item.slug} className="studio-project"><div className="studio-project-image"><img src={item.cover_image_url} alt={name+' — example of Roxanne’s design work'} loading="lazy"/></div><div className="studio-project-info"><div><p className="studio-eyebrow">Portfolio · {name}</p><h3>{title}</h3><p>{description}</p><Link className="studio-text-link" to={'/ideas?seed='+item.slug+'#possibilities'}>Explore a similar idea for you ↗</Link></div></div></article>;})}</div>}
 </div></section>;
}
