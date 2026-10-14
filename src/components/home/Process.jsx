const steps=[
 ['01','Share the spark','Tell me what you’re imagining, or what you wish worked better.'],
 ['02','Shape it together','We agree on a plan, then build with room for your feedback.'],
 ['03','Bring it to life','We review, launch, and make sure you feel ready for what’s next.']
];
export default function Process(){return <section id="process" className="studio-section"><div className="studio-wrap"><p className="studio-eyebrow">Personal from the first hello</p><h2>A little conversation.<br/>A clear way forward.</h2><div className="studio-process-grid">{steps.map(([n,title,copy])=><div key={n}><span className="studio-step-number">{n}</span><h3>{title}</h3><p>{copy}</p></div>)}</div></div></section>;}
