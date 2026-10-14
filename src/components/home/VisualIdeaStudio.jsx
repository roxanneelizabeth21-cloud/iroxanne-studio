import {useEffect,useRef,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {ArrowRight,ArrowLeft,CalendarDays,ShoppingBag,House,Leaf,Sparkles,Users,Check,LayoutDashboard,MessageCircle} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {seedIdeas,BRIEF_KEY} from '@/lib/ideaExplorer';
import './visual-ideas.css';

const types={
 hair:{label:'Hair & beauty',name:'Your salon',headline:'Your next good hair day.',sub:'Find your service. Make a little time for yourself.',screen:'booking',icon:Sparkles,services:['Cut & style','Color consultation','Special occasion'],goals:['Make booking easier','Keep client details together','Sell salon products']},
 'real-estate':{label:'Real estate',name:'Your property studio',headline:'Find a place to call yours.',sub:'Discover homes, explore the neighborhood, and arrange a visit.',screen:'property',icon:House,services:['Property tour','Buyer conversation','Seller consultation'],goals:['Showcase my listings','Keep track of inquiries','Plan my marketing']},
 landscaping:{label:'Landscaping',name:'Your outdoor studio',headline:'A little more life outside.',sub:'From the first idea to the finishing touches. Let’s plan your outdoor space.',screen:'jobs',icon:Leaf,services:['Garden refresh','Lawn care','Seasonal planting'],goals:['Collect project requests','Organize crews and visits','Show my work']},
 services:{label:'Service business',name:'Your service studio',headline:'A helping hand, right on time.',sub:'Choose the help you need and find a time that works.',screen:'booking',icon:CalendarDays,services:['First consultation','Service visit','Follow-up appointment'],goals:['Let customers book','Organize my daily work','Keep customers updated']},
 products:{label:'Products & retail',name:'Your collection',headline:'Everyday things. Thoughtfully chosen.',sub:'Discover pieces that make your everyday a little more yours.',screen:'shop',icon:ShoppingBag,services:['Everyday tote','Studio mug','Evening candle'],goals:['Sell my products','Manage orders and stock','Plan a product launch']},
 marketing:{label:'Marketing tools',name:'Your content studio',headline:'Your next week, thoughtfully planned.',sub:'A place for ideas, drafts, and the stories you want to share.',screen:'marketing',icon:Sparkles,services:['Brand story','Helpful tip','Product spotlight'],goals:['Plan social posts','Create content drafts','Organize campaigns']},
 community:{label:'Community or creative idea',name:'Your gathering place',headline:'Good ideas are better together.',sub:'Read, learn, and share a little inspiration.',screen:'community',icon:Users,services:['A fresh perspective','A moment to reflect','Something to try'],goals:['Share useful resources','Bring people together','Organize events']},
 personal:{label:'Life & personal tools',name:'Your everyday space',headline:'A little less to keep in your head.',sub:'Make room for plans, routines, and the things that matter.',screen:'jobs',icon:LayoutDashboard,services:['Plan the week','Family activities','Meal ideas'],goals:['Organize plans and tasks','Keep everyone connected','Build a helpful routine']}
};
const screens={booking:'Booking experience',property:'Property website',shop:'Online shop',jobs:'Behind-the-scenes workspace',marketing:'Marketing calendar',community:'Community & resources'};
function identify(text,fallback='services'){
 const t=text.toLowerCase();
 if(/salon|hair|beauty|barber/.test(t))return 'hair';
 if(/real estate|property|realtor|listing/.test(t))return 'real-estate';
 if(/landscap|lawn|garden/.test(t))return 'landscaping';
 if(/shop|store|product|retail|sell/.test(t))return 'products';
 if(/social|marketing|campaign|content calendar/.test(t))return 'marketing';
 if(/community|reading|reflection|learn|teach|creative|art|music/.test(t))return 'community';
 if(/family|travel|trip|personal|meal|routine/.test(t))return 'personal';
 return fallback;
}
function screenFor(text,fallback){
 const t=text.toLowerCase();
 if(/book|appointment|visit|event/.test(t))return 'booking';
 if(/sell|product|shop|stock|order/.test(t))return 'shop';
 if(/marketing|social|campaign|content draft/.test(t))return 'marketing';
 if(/listing|property|showcase/.test(t))return 'property';
 if(/community|resource|learn|share|connect/.test(t))return 'community';
 if(/organiz|task|crew|work|client|inquir|plan/.test(t))return 'jobs';
 return fallback;
}
function Preview({kind,screen,title,detail}){
 const c=types[kind],Icon=c.icon;
 const [selected,setSelected]=useState(0),[time,setTime]=useState(''),[cart,setCart]=useState([]),[done,setDone]=useState(false);
 useEffect(()=>{setSelected(0);setTime('');setCart([]);setDone(false);},[kind,screen]);
 const rows=c.services;
 return <div className={'vi-window vi-'+kind}>
 <div className="vi-windowbar"><span aria-hidden="true">● ● ●</span><span>Interactive concept · sample content</span></div>
 <div className="vi-brand"><span><Icon size={20}/>{title||c.name}</span><span className="vi-demo-pill">Preview</span></div>
 {screen==='booking'&&<><div className="vi-preview-hero"><span>YOUR CUSTOMER EXPERIENCE</span><h3>{c.headline}</h3><p>{c.sub}</p></div><div className="vi-booking"><div><h4>1. Choose a service</h4>{rows.map((s,i)=><button className={selected===i?'selected':''} key={s} onClick={()=>{setSelected(i);setDone(false);}}><span>{s}</span>{selected===i?<Check size={16}/>:<ArrowRight size={16}/>}</button>)}</div><div><h4>2. Find a time</h4><div className="vi-date"><CalendarDays size={18}/> A sample day · Thursday 22</div><div className="vi-times">{['9:00 AM','11:30 AM','2:00 PM','4:30 PM'].map(t=><button key={t} className={time===t?'selected':''} onClick={()=>{setTime(t);setDone(false);}}>{t}</button>)}</div><button className="vi-solid" disabled={!time} onClick={()=>setDone(true)}>Preview booking</button><p role="status" className="vi-feedback">{done?rows[selected]+' at '+time+' — this is how a booking confirmation could look. Nothing was booked.':'Try a service and time to see the next step.'}</p></div></div></>}
 {screen==='property'&&<><div className="vi-property-scene"><div className="vi-house"><i/><i/><i/></div><div><span>A SAMPLE PROPERTY COLLECTION</span><h3>Somewhere to<br/>begin again.</h3></div></div><div className="vi-property-grid">{['The Garden House','The City Retreat'].map((name,i)=><button key={name} onClick={()=>{setSelected(i);setDone(true);}} className={selected===i?'selected':''}><House size={26}/><strong>{name}</strong><small>{i?'Light-filled spaces · City living':'Room to grow · Outdoor living'}</small><span>Explore this home ↗</span></button>)}</div><div className="vi-inline"><p>{done?'Exploring '+(selected?'The City Retreat':'The Garden House'):'Help buyers take the next step.'}</p><button className="vi-solid" onClick={()=>{setDone(true);setTime('tour');}}>Request a tour</button></div>{time&&<p role="status" className="vi-feedback">A tour request could collect preferred dates and contact details. This is a demonstration.</p>}</>}
 {screen==='shop'&&<><div className="vi-shop-banner"><span>YOUR OWN STOREFRONT</span><h3>{kind==='hair'?'Good hair days, at home.':'Small finds. Everyday joy.'}</h3><p>A collection with a story to tell.</p></div><div className="vi-products">{['Everyday favorite','A thoughtful essential','Something special'].map((name,i)=><article key={name}><div className={'vi-product-object item-'+i}><ShoppingBag size={48} strokeWidth={1}/></div><h4>{name}</h4><small>Sample product</small><button onClick={()=>setCart([...cart,i])}>Add to sample bag +</button></article>)}</div><div className="vi-inline"><span role="status"><ShoppingBag size={18}/> Sample bag · {cart.length} items</span><button disabled={!cart.length} onClick={()=>setDone(true)} className="vi-solid">Preview order</button></div>{done&&<p className="vi-feedback" role="status">Your sample order contains {cart.length} items. A real shop could connect checkout, stock, and customer updates.</p>}</>}
 {screen==='jobs'&&<><div className="vi-dashboard-heading"><div><span>YOUR WORKSPACE</span><h3>{kind==='personal'?'A calmer week starts here.':'A clear view of your day.'}</h3></div><span className="vi-avatar">You</span></div><div className="vi-stat-row">{[[3,'To plan'],[2,'In progress'],[done?2:1,'Completed']].map(([n,l])=><div key={l}><strong>{n}</strong><small>{l}</small></div>)}</div><div className="vi-work-list"><h4>{kind==='personal'?'Your weekly board':'Your next steps'}</h4>{rows.map((r,i)=><button key={r} onClick={()=>{setSelected(i);setDone(false);}} className={selected===i?'selected':''}><span className="vi-task-dot"/><span>{r}</span><small>{i===0?'Ready to plan':i===1?'In progress':'To review'}</small></button>)}</div><div className="vi-task-detail"><h4>{rows[selected]}</h4><p>{detail||'Keep notes, assign the next step, and see what needs attention.'}</p><button className="vi-solid" onClick={()=>setDone(!done)}>{done?'Reopen sample task':'Mark sample task complete'}</button><span role="status">{done?' ✓ Sample task completed':''}</span></div></>}
 {screen==='marketing'&&<><div className="vi-dashboard-heading"><div><span>YOUR MARKETING WORKSPACE</span><h3>A week of stories.</h3></div><CalendarDays/></div><div className="vi-mini-calendar">{['Mon','Wed','Fri'].map((day,i)=><div key={day}><span>{day}</span><button onClick={()=>setSelected(i)} className={selected===i?'selected':''}><div className={'vi-post-art art-'+i}><Sparkles size={24}/><strong>{['A fresh start.','A little know-how.','Made for you.'][i]}</strong></div><small>{['Brand story','Helpful tip','Product spotlight'][i]}</small></button></div>)}</div><div className="vi-task-detail"><span>POST PREVIEW</span><h4>{['A fresh start.','A little know-how.','Made for you.'][selected]}</h4><p>{['Every good idea starts somewhere. Here’s a little look at what we’re creating this week.','A small tip can make a big difference. Share one useful thing your customers can try today.','Introduce the care, thought, and people behind your next product or service.'][selected]}</p><button className="vi-solid" onClick={()=>setDone(!done)}>{done?'Return to draft':'Mark ready for review'}</button><p role="status" className="vi-feedback">{done?'Sample draft ready for review. Nothing publishes from this preview.':'Click a calendar card to preview its content.'}</p></div></>}
 {screen==='community'&&<><div className="vi-preview-hero"><span>A PLACE TO CONNECT</span><h3>{c.headline}</h3><p>{c.sub}</p></div><div className="vi-resource-grid">{['Read & discover','Share & connect','Meet & learn'].map((r,i)=><button className={selected===i?'selected':''} key={r} onClick={()=>setSelected(i)}><Users size={26}/><h4>{r}</h4><span>Take a look ↗</span></button>)}</div><div className="vi-task-detail"><h4>{['A moment of inspiration','A conversation worth having','Your next gathering'][selected]}</h4><p>{['A featured article, lesson, or resource could live here, with a library to explore at your own pace.','A member space could bring discussions, shared resources, and helpful updates together.','A shared events space could help your community discover what’s coming up and express interest.'][selected]}</p><button className="vi-solid" onClick={()=>setDone(!done)}>{done?'Saved to sample list':'Save this sample'}</button></div></>}
 </div>;
}
export default function VisualIdeaStudio(){
 const loc=useLocation(),navigate=useNavigate(),seed=new URLSearchParams(loc.search).get('seed');
 const initial=seedIdeas[seed]||'';
 const [idea,setIdea]=useState(initial),[kind,setKind]=useState(identify(initial)),[screen,setScreen]=useState(types[identify(initial)].screen),[started,setStarted]=useState(!!initial),[ai,setAI]=useState(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[answers,setAnswers]=useState([]),[reply,setReply]=useState('');
 const request=useRef(0);
 useEffect(()=>()=>{request.current++;},[]);
 useEffect(()=>{if(seedIdeas[seed]){const text=seedIdeas[seed],k=identify(text);request.current++;setBusy(false);setIdea(text);setKind(k);setScreen(types[k].screen);setStarted(true);setAI(null);setAnswers([]);setNotice('');}},[seed]);
 const c=types[kind];
 function choose(k){setIdea('');setReply('');request.current++;setBusy(false);setNotice('');setKind(k);setScreen(types[k].screen);setStarted(true);setAI(null);setAnswers([]);}
 async function explore(text=idea){
  if(!text.trim()){choose('services');setNotice('No idea needed. Try booking a service in the preview, or choose another starting point.');return;}
  const k=identify(text,kind);choose(k);setIdea(text);const id=++request.current;setBusy(true);let timer;
  try{
   const r=await Promise.race([base44.functions.invoke('exploreStudioIdea',{idea:text.slice(0,1200),kind:types[k].label}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),15000);})]);
   const result=(r.data||r).concept;
   if(id!==request.current)return;
   if(!result||typeof result.title!=='string'||!Array.isArray(result.choices)||!result.choices.every(x=>typeof x==='string'))throw Error();
   setAI(result);
   if(k==='services'){const suggested=identify(result.title+' '+result.summary,k);setKind(suggested);setScreen(types[suggested].screen);}
  }catch{if(id===request.current)setNotice('You can keep exploring these examples. Choose what feels closest, or tell Roxanne what you have in mind.');}
  finally{clearTimeout(timer);if(id===request.current)setBusy(false);}
 }
 function answer(text){request.current++;setBusy(false);const next=screenFor(text,screen);setScreen(next);setAnswers([...answers.slice(-3),text]);setReply('');}
 const followups={booking:['Customers choose a time','Customers request a time'],shop:['A small curated collection','A larger product catalog'],property:['Focus on property listings','Focus on client inquiries'],jobs:['Just me','A team working together'],marketing:['I create the content','My team reviews drafts'],community:['An open resource library','A member community']};
 function handoff(){
  const brief={business_type:c.label,quick_pitch:[idea||'I would like help exploring an idea.','Visual direction: '+screens[screen],...answers.map(a=>'Preference: '+a),'Starting concept: '+(ai?.title||c.name),'Exploratory concept; scope to be discussed with Roxanne.'].join('\n')};
  try{sessionStorage.setItem(BRIEF_KEY,JSON.stringify(brief));}catch{}
  navigate('/quote?from=idea-explorer',{state:{ideaBrief:brief}});
 }
 return <div id="possibilities" className="vi-studio studio-wrap">
 <header className="vi-intro"><p className="studio-eyebrow">Let’s imagine it together</p><h1>Your business. Your idea.<br/><em>Let’s see what’s possible.</em></h1><p>Tell me a little, or pick a starting point. Explore an example, then shape it around you.</p></header>
 <form className="vi-prompt" onSubmit={e=>{e.preventDefault();explore();}}><label htmlFor="visual-idea">What’s your business or idea?</label><div><input id="visual-idea" value={idea} maxLength={1200} onChange={e=>setIdea(e.target.value)} placeholder="I’m a hairdresser and want to run my business in one place…"/><button className="studio-button" type="submit">Show me possibilities <ArrowRight size={17}/></button></div></form>
 <div className="vi-starts" aria-label="Choose an example">{Object.entries(types).map(([k,v])=>{const Icon=v.icon;return <button key={k} type="button" aria-pressed={started&&kind===k} onClick={()=>choose(k)}><Icon size={16}/>{v.label}</button>;})}<button type="button" onClick={()=>{setIdea('');choose('services');setNotice('Start by trying a sample booking. Switch examples whenever something catches your interest.');}}>I don’t know yet</button></div>
 {!started?<div className="vi-welcome"><div><p className="studio-eyebrow">No finished plan required</p><h2>Start with something<br/>you wish were easier.</h2><p>Booking customers. Selling your products. Keeping work organized. Bringing people together.</p><button className="studio-button" onClick={()=>choose('services')}>Show me an example <ArrowRight size={16}/></button></div><Preview kind="services" screen="booking"/></div>:
 <div className="vi-experience"><aside className="vi-conversation"><p className="studio-eyebrow">Shaping your idea</p><h2>{ai?.title||c.name}</h2><p>{ai?.summary||'Here’s one direction we could explore. Try the preview and tell me what would help you most.'}</p>{busy&&<p role="status" className="vi-feedback">Finding a direction for your idea… You can explore while it loads.</p>}{notice&&<p role="status" className="vi-feedback">{notice}</p>}{answers.length>0&&<div className="vi-answers">{answers.map((a,i)=><p key={i}><Check size={14}/>{a}</p>)}</div>}
 <h3>{answers.length===0?(ai?.question||'What would help you most?'):answers.length===1?'How would you like that to work?':'What else would you like to explore?'}</h3><div className="vi-answer-options">{(answers.length===0?(ai?.choices||c.goals):answers.length===1?followups[screen]:['Try another part of the app','Talk through this with Roxanne']).map(a=><button key={a} onClick={()=>a==='Talk through this with Roxanne'?handoff():a==='Try another part of the app'?setAnswers([]):answer(a)}>{a}<ArrowRight size={14}/></button>)}</div>
 <form onSubmit={e=>{e.preventDefault();if(reply.trim())explore((idea+'\n'+answers.join('. ')+'\n'+reply).slice(-1200));}}><label htmlFor="visual-reply">Or tell me more</label><textarea id="visual-reply" value={reply} maxLength={500} rows={2} onChange={e=>setReply(e.target.value)} placeholder="I also need a way to…"/><button type="submit" className="studio-text-link" disabled={!reply.trim()}>Update my direction ↗</button></form><button className="studio-button" onClick={handoff}>Talk with Roxanne about this <MessageCircle size={16}/></button><button className="studio-text-link" onClick={()=>{request.current++;setStarted(false);setAI(null);setBusy(false);setAnswers([]);setIdea('');}}><ArrowLeft size={14}/>Start fresh</button>
 </aside><div className="vi-preview-area"><div className="vi-preview-picker"><label htmlFor="visual-screen">Take a look inside</label><select id="visual-screen" value={screen} onChange={e=>setScreen(e.target.value)}>{Object.entries(screens).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></div><Preview kind={kind} screen={screen} title={ai?.title} detail={answers[answers.length-1]}/><p className="vi-preview-note">Try the controls. This is an illustrative starting point, not a finished app or confirmed scope. Your website and tools would be designed around you.</p></div></div>}
 </div>;
}
