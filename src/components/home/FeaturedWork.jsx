import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
export default function FeaturedWork({ items, loading }) {
 return <section id="work" tabIndex={-1} className="studio-section studio-work" aria-label="Selected projects"><div className="studio-wrap">
  <div className="studio-section-heading"><div><p className="studio-eyebrow">A few ideas, brought to life</p><h2>Different dreams.<br/><em>Distinctly their own.</em></h2></div><a className="studio-text-link" href="/ideas">Explore all projects <ArrowUpRight size={17}/></a></div>
  {loading?<p role="status">Loading projects…</p>:!items?.length?<p>Project previews are taking a moment. <a href="/ideas">Explore the portfolio.</a></p>:<div className="studio-project-grid">{items.map((item,i)=><Link key={item.id||item.slug} to={'/work/'+item.slug} className={'studio-project studio-project-'+i}><div className="studio-project-image"><img src={item.cover_image_url} alt={item.title+' project visual'} loading="lazy"/></div><div className="studio-project-info"><div><p className="studio-eyebrow">{item.category==='Other'?'Custom web app':item.category}</p><h3>{item.title}</h3><p>{item.tagline}</p></div><span className="studio-project-arrow"><ArrowUpRight aria-label="View project"/></span></div></Link>)}</div>}
 </div></section>;
}
