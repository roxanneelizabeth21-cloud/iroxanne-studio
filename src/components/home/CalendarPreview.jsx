import { useState } from 'react';
import { CalendarDays, LayoutGrid, ArrowRight } from 'lucide-react';
import PostChip from '@/components/marketing/PostChip';
const posts=[
 {id:'demo-1',day:0,platform:'Instagram',format:'Feed Post',status:'Scheduled',scheduled_time:'9:00 AM',hook:'A little inspiration to start the week',caption:'A sample post for a fresh start. Add your own image, caption, and voice.',media_file_url:'/images/quiet-time-daily-portfolio.jpg'},
 {id:'demo-2',day:1,platform:'Facebook',format:'Feed Post',status:'Draft',scheduled_time:'12:00 PM',hook:'Take a peek behind the scenes',caption:'An example of a behind-the-scenes story, ready for review.'},
 {id:'demo-3',day:2,platform:'Instagram',format:'Reel',status:'Approved',scheduled_time:'10:00 AM',hook:'One idea. A whole new possibility.',caption:'A sample project spotlight to show how a post moves through the calendar.'},
 {id:'demo-4',day:4,platform:'Facebook',format:'Feed Post',status:'Scheduled',scheduled_time:'9:00 AM',hook:'What would you love to create?',caption:'An example invitation to start a conversation.'},
];
export default function CalendarPreview(){
 const [view,setView]=useState('week'),[selected,setSelected]=useState(posts[0]);
 return <section id="calendar-preview" className="studio-section studio-calendar-section"><div className="studio-wrap">
  <div className="studio-section-heading"><div><p className="studio-eyebrow">Behind the scenes</p><h2>The tools that make<br/><em>your day easier.</em></h2></div><p className="studio-calendar-intro">A social post calendar is one possibility. Imagine a workspace built around the way you create, plan, and run things.</p></div>
  <div className="studio-calendar-shell">
   <div className="studio-calendar-toolbar"><div><span className="studio-eyebrow">A look inside a custom tool</span><h3>Social post calendar</h3></div><div className="studio-calendar-switch" aria-label="Demo calendar view"><button type="button" aria-pressed={view==='week'} onClick={()=>setView('week')}><CalendarDays size={16}/>Week</button><button type="button" aria-pressed={view==='grid'} onClick={()=>setView('grid')}><LayoutGrid size={16}/>Grid</button></div></div>
   <p className="studio-demo-label">Interactive demonstration · sample posts · nothing here publishes</p>
   {view==='week'?<div className="studio-calendar-scroll" tabIndex={0} role="region" aria-label="Sample weekly social calendar"><div className="studio-calendar-week">{['Monday','Tuesday','Wednesday','Thursday','Friday'].map((day,i)=><div className="studio-calendar-day" key={day}><div className="studio-calendar-day-label">{day}<span>{12+i}</span></div>{posts.filter(p=>p.day===i).map(post=><PostChip key={post.id} post={post} view="week" draggable={false} onClick={()=>setSelected(post)}/>)}{i===3&&<p className="studio-calendar-space">Room for your next idea</p>}</div>)}</div></div>:<div className="studio-calendar-grid">{posts.map(post=><PostChip key={post.id} post={post} view="week" draggable={false} onClick={()=>setSelected(post)}/>)}</div>}
   <div className="studio-calendar-detail" aria-live="polite"><span>{selected.platform} · {selected.status} · Sample post</span><h4>{selected.hook}</h4><p>{selected.caption}</p></div>
  </div>
  <div className="studio-actions"><a className="studio-button" href="/quote">Imagine your own workspace <ArrowRight size={17}/></a><p className="studio-note">Content calendars, creative studios, planners, dashboards… what would help you?</p></div>
 </div></section>;
}
