import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, LayoutDashboard, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { concepts } from './conceptData';
import { readDraft, saveDraft, makeBrief, defaultDraft, BRIEF_KEY } from '@/lib/ideaExplorer';

const audiences=['Customers','My team','A community','My family or just me'];
export default function BusinessConcepts(){
 const location=useLocation(),navigate=useNavigate();
 const seed=new URLSearchParams(location.search).get('seed');
 const [d,setD]=useState(()=>readDraft(seed)),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [previewFeature,setPreviewFeature]=useState(''); const heading=useRef(null),requestId=useRef(0),mounted=useRef(true);
 useEffect(()=>{saveDraft(d);},[d]);
 const previousStep=useRef(d.step);
 useEffect(()=>{if(previousStep.current!==d.step){heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'start',behavior:'auto'});previousStep.current=d.step;}},[d.step]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;requestId.current++;};},[]);
 useEffect(()=>{setD(readDraft(seed));},[seed]);
 const update=patch=>setD(prev=>({...prev,...patch}));
 const move=step=>{update({step});requestAnimationFrame(()=>heading.current?.focus({preventScroll:true}));};
 const concept=concepts.find(c=>c.id===d.kind)||concepts[concepts.length-1];
 const suggested=d.ai?.features?.length?d.ai.features:concept.modules;
 const selected=Array.isArray(d.features)?d.features:suggested.slice(0,3);
 const features=[...new Set([...selected,...(d.customFeature.trim()?[d.customFeature.trim()]:[])])].slice(0,6);
 const active=features.includes(previewFeature)?previewFeature:features[0];
 const goals=d.ai?.choices?.length?d.ai.choices:[
 concept.id==='hair'?'Make appointments easier':concept.id==='real-estate'?'Bring listings and marketing together':concept.id==='landscaping'?'Organize jobs and recurring visits':concept.id==='products'?'Sell and manage my products':'Make everyday tasks easier',
 'Reach more people','Create something new'];
 async function begin(){
  setNotice('');update({goal:'',features:null,ai:null,step:2});
  if(d.idea.trim().length<8)return;
  const id=++requestId.current;setBusy(true);
  let timer;
  try{
   const response=await Promise.race([base44.functions.invoke('exploreStudioIdea',{idea:d.idea.trim(),kind:concept.name}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('timeout')),15000);})]);
   const result=response?.data||response;
   if(!mounted.current||id!==requestId.current)return;
   if(!result?.concept||!Array.isArray(result.concept.features)||!result.concept.features.length)throw new Error('fallback');
   update({ai:result.concept});
  }catch{if(mounted.current&&id===requestId.current)setNotice('Let’s use a few starting points. You can keep exploring and change anything.');}
  finally{clearTimeout(timer);if(mounted.current&&id===requestId.current)setBusy(false);}
 }
 function chooseGoal(goal){requestId.current++;setBusy(false);update({goal,step:3});}
 function startOver(){requestId.current++;setBusy(false);setNotice('');setPreviewFeature('');setD({...defaultDraft});}
 function handoff(){
  const brief=makeBrief(d,concept,features);
  try{sessionStorage.setItem(BRIEF_KEY,JSON.stringify(brief));}catch{/* router state carries the brief without storage */}
  navigate('/quote?from=idea-explorer',{state:{ideaBrief:brief}});
 }
 const resultTitle=d.ai?.title||concept.studio;
 return <section id="possibilities" className="studio-section studio-concepts"><div className="studio-wrap">
  <div className="studio-section-heading"><div><p className="studio-eyebrow">A little curiosity goes a long way</p><h2>What could we<br/><em>create for you?</em></h2></div><p className="studio-calendar-intro">A clear plan, a rough idea, or no idea at all. Start wherever you are.</p></div>
  <div className="idea-explorer">
   <div className="idea-progress" aria-label="Explorer progress">{['Start','Your idea','Your goal','For whom','Your concept'].map((name,i)=><span key={name} aria-current={d.step===i?'step':undefined} className={i<=d.step?'is-current':''}>{name}</span>)}</div>
   <div className="idea-question" ref={heading} tabIndex={-1}>
   {d.step===0&&<><h3>Where are you starting?</h3><div className="idea-start-grid">{[['clear','I know what I want','Let’s shape the details.'],['rough','I have a rough idea','A little spark is enough.'],['browse','I’m not sure—show me','Discover a few possibilities.']].map(([mode,label,help])=><button key={mode} type="button" onClick={()=>update({mode,step:1})}><Sparkles size={24}/><strong>{label}</strong><span>{help}</span><ArrowRight size={18}/></button>)}</div></>}
   {d.step===1&&<><h3>{d.mode==='browse'?'Let’s find something that sparks your interest.':'Tell me a little about what you’re imagining.'}</h3><div className="idea-input-grid"><div><label htmlFor="idea-kind">Choose a starting point</label><select id="idea-kind" value={d.kind} onChange={e=>update({kind:e.target.value,ai:null,features:null})}>{concepts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><label htmlFor="idea-description">Your idea, in your words <span>(optional)</span></label><textarea id="idea-description" value={d.idea} maxLength={1200} rows={3} onChange={e=>update({idea:e.target.value,ai:null})} placeholder="I wish there were a way to…"/></div><div className="idea-inspiration"><p className="studio-eyebrow">Need a little inspiration?</p>{['Help customers book my services','Bring my community together','Create a tool for my everyday life'].map(text=><button type="button" key={text} onClick={()=>update({idea:text,ai:null})}>{text} ↗</button>)}</div></div><div className="studio-actions"><button className="studio-button" type="button" onClick={begin}>Explore possibilities <ArrowRight size={16}/></button><button className="studio-text-link" type="button" onClick={()=>{update({idea:'',ai:null,features:null,goal:'',step:2});}}>I don’t know yet—guide me</button></div><p className="idea-small">When you describe an idea, AI helps suggest a direction. You can explore without entering anything.</p></>}
   {d.step===2&&<><h3>{d.ai?.question||'What would you love to make easier or possible?'}</h3>{busy&&<p className="idea-ai-status" role="status"><Loader2 size={16} className="animate-spin"/>Finding a few directions for your idea… You can also choose below.</p>}{notice&&<p role="status" className="idea-small">{notice}</p>}<div className="idea-options">{goals.map(goal=><button type="button" key={goal} onClick={()=>chooseGoal(goal)}>{goal}<ArrowRight size={16}/></button>)}</div><label htmlFor="idea-goal">Or tell me in your own words</label><input id="idea-goal" maxLength={300} value={d.goal} onChange={e=>update({goal:e.target.value})} placeholder="What would make a difference for you?"/><div className="studio-actions"><button type="button" className="studio-button" onClick={()=>chooseGoal(d.goal.trim()||'Help me discover the possibilities')}>Continue</button><button className="studio-text-link" type="button" onClick={()=>chooseGoal('Help me discover the possibilities')}>Not sure—keep exploring</button></div></>}
   {d.step===3&&<><h3>Who would this help?</h3><p className="studio-subtitle">We’ll use this to shape the first experience.</p><div className="idea-options">{audiences.map(a=><button key={a} type="button" onClick={()=>update({audience:a,step:4})}>{a}<ArrowRight size={16}/></button>)}</div><button type="button" className="studio-text-link" onClick={()=>update({audience:'Still exploring',step:4})}>Not sure—show me a concept</button></>}
   {d.step===4&&<><div className="idea-result-heading"><div><p className="studio-eyebrow">Your starting concept {d.ai?'· AI-assisted':''}</p><h3>{resultTitle}</h3><p>{d.ai?.summary||concept.intro}</p></div><button className="studio-text-link" type="button" onClick={()=>move(1)}>Change my answers</button></div>
    <div className="idea-result-grid"><div><h4>What matters most to start?</h4><p className="idea-small">Choose the parts you like. The preview changes with you.</p><div className="idea-feature-options">{suggested.map(feature=><button type="button" key={feature} aria-pressed={selected.includes(feature)} onClick={()=>{const current=selected;update({features:current.includes(feature)?current.filter(x=>x!==feature):[...current,feature]});}}><CheckCircle2 size={16}/>{feature}</button>)}</div><label htmlFor="idea-extra">Something else?</label><input id="idea-extra" maxLength={80} value={d.customFeature} onChange={e=>update({customFeature:e.target.value})} placeholder="Add a possibility of your own"/><p className="idea-small">For: {d.audience||'Still exploring'}<br/>Your goal: {d.goal||'Find a starting point'}</p></div>
    <div className={'studio-concept-screen concept-'+concept.id}><div className="studio-concept-screenbar"><span aria-hidden="true">● ● ●</span><span>Concept preview · sample content</span></div><div className="studio-concept-screenhead"><strong>{resultTitle}</strong><Sparkles size={20}/></div><div className="idea-preview-tabs" aria-label="Explore concept features">{features.map(f=><button key={f} type="button" aria-pressed={f===active} onClick={()=>setPreviewFeature(f)}>{f}</button>)}</div><div className="studio-concept-screenbody"><div className="studio-concept-workspace-title"><LayoutDashboard size={18}/><h4>{active||'A place for your next idea'}</h4></div><div className="idea-preview-welcome"><span className="studio-eyebrow">{d.audience==='My team'?'Your team workspace':d.audience==='Customers'?'Your customer experience':d.audience==='A community'?'Your community space':'Your personal starting point'}</span><h4>{d.goal&&d.goal!=='Help me discover the possibilities'?d.goal:'Make room for something new.'}</h4><p>{d.idea||'A welcoming place to begin, with the tools you choose.'}</p></div>{!d.ai && <div className="idea-sample-rows" aria-label="Sample workspace items">{concept.items.map(([title,type,status],i)=><div key={title}><span className="idea-sample-number">0{i+1}</span><div><strong>{title}</strong><small>{type}</small></div><span>{status}</span></div>)}</div>}<div className="idea-preview-flow">{['Discover','Take the next step','Stay connected'].map((label,i)=><div key={label}><span>0{i+1}</span><strong>{label}</strong><small>{i===0?active||'Explore your idea':i===1?d.audience==='My team'?'Plan the work together':'A clear, simple action':features[1]||'Helpful updates'}</small></div>)}</div></div></div></div>
    <div className="studio-actions"><button type="button" className="studio-button" onClick={handoff}>Let’s build this <ArrowRight size={17}/></button><button type="button" className="studio-text-link" onClick={startOver}>Explore another idea</button></div><p className="idea-small">A concept to explore together. Features, connections, and scope are confirmed with Roxanne. Your answers carry into the inquiry.</p>
   </>}
   </div>
   {d.step>0&&d.step<4&&<div className="idea-back"><button type="button" className="studio-text-link" onClick={()=>{requestId.current++;setBusy(false);move(d.step-1);}}><ArrowLeft size={15}/>Back</button></div>}
  </div>
 </div></section>;
}
