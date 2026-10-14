import React, {useEffect,useState} from 'react';
import {base44} from '@/api/base44Client';
export default function QuoteEstimateReview({leadId}) {
 const [lead,setLead]=useState(null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{let active=true;setLead(null);setFailed(false);
 if(leadId)base44.entities.Lead.get(leadId).then(l=>{if(active)setLead(l);}).catch(()=>{if(active)setFailed(true);});
 return()=>{active=false;};},[leadId]);
 if(failed)return <p role="alert">Could not load the original notes. Open the quote request before approving this proposal.</p>;
 let data;try{data=JSON.parse(lead?.draft_estimate_json||'null');}catch{return <p>Review the original quote request; the estimate notes could not be displayed.</p>;}
 if(!data)return lead?.draft_estimate_status==='failed'?<p>Automatic draft preparation did not finish. Review the request and retry or prepare it manually.</p>:null;
 return <aside className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm space-y-3 text-slate-800">
 <h3 className="font-semibold">Internal estimate — for Roxanne’s review</h3>
 <p>{data.summary}</p>
 {data.estimate?<p className="font-semibold">Suggested range: ${data.estimate.priceLow.toLocaleString()}–${data.estimate.priceHigh.toLocaleString()} · {data.estimate.hoursLow}–{data.estimate.hoursHigh} hours</p>:<p className="font-semibold">Price needs clarification. No price has been suggested.</p>}
 {data.basis&&<p>{data.basis}</p>}
 <p>Required features: {data.mustHave.join('; ')||'Not established'}</p>
 {data.niceToHave.length>0&&<p>Optional features included in this estimate: {data.niceToHave.join('; ')}</p>}
 {data.integrations.length>0&&<p>Connections: {data.integrations.join('; ')}</p>}
 {data.questions.length>0&&<div><h4 className="font-semibold">Questions to resolve</h4><ul className="list-disc pl-5">{data.questions.map((q,i)=><li key={i}>{q}</li>)}</ul></div>}
 {data.assumptions.length>0&&<div><h4 className="font-semibold">Assumptions to check</h4><ul className="list-disc pl-5">{data.assumptions.map((q,i)=><li key={i}>{q}</li>)}</ul></div>}
 <details><summary className="cursor-pointer">Supporting customer notes</summary>{[...data.evidence,...data.integration_evidence].map((e,i)=><p key={i} className="mt-2"><strong>{e.label}:</strong> “{e.evidence}”</p>)}<p className="whitespace-pre-wrap mt-3">{lead.quick_pitch}</p></details>
 <p className="text-xs">This analysis stays internal. Confirm scope, external charges, timing, price and payment terms before sending.</p>
 </aside>;
}
