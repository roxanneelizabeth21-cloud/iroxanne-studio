export const DRAFT_KEY='iroxanne-idea-draft-v1';
export const BRIEF_KEY='iroxanne-idea-brief-v1';
export const seedIdeas={
 'quiet-time-daily':'A welcoming space for daily reflection, readings, and a community.',
 'booked-now-what':'A travel planning tool that helps people make more of their trips.',
 nestflow:'A shared home base for family schedules, meals, and everyday tasks.'
};
export const defaultDraft={step:0,mode:'',kind:'anything',idea:'',goal:'',audience:'',features:null,customFeature:'',ai:null};
const validConcept=c=>c&&['title','summary','question'].every(k=>typeof c[k]==='string')&&['features','choices'].every(k=>Array.isArray(c[k])&&c[k].length<=5&&c[k].every(v=>typeof v==='string'&&v.length<=80));
export function readDraft(seed){
 if(seedIdeas[seed])return {...defaultDraft,step:1,mode:'rough',idea:seedIdeas[seed]};
 try{const d=JSON.parse(sessionStorage.getItem(DRAFT_KEY)||'null');return d&&Number.isInteger(d.step)&&d.step>=0&&d.step<=4&&['idea','goal','audience','kind','customFeature','mode'].every(k=>typeof d[k]==='string')&&(d.features===null||Array.isArray(d.features)&&d.features.every(v=>typeof v==='string'))?{...defaultDraft,...d,ai:validConcept(d.ai)?d.ai:null}:defaultDraft;}catch{return defaultDraft;}
}
export function saveDraft(d){try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(d));}catch{/* in-memory explorer remains usable */}}
export function makeBrief(d,concept,features){
 return {business_type:concept.name==='Something entirely different'?'':concept.name,quick_pitch:[
 d.idea.trim()||'I would like help shaping an idea.',
 'Starting point: '+(d.mode||'exploring'),
 'Goal: '+(d.goal||'Help me decide'),
 'For: '+(d.audience||'Still exploring'),
 'First priorities: '+(features.join(', ')||'Help me choose'),
 'Concept direction: '+(d.ai?.title||concept.studio),
 'This is an exploratory concept, not an agreed scope.'
 ].join('\n')};
}
export function readBrief(state,enabled){
 const valid=b=>b&&typeof b.quick_pitch==='string'&&b.quick_pitch.length<=6000&&typeof b.business_type==='string'&&b.business_type.length<=100?{quick_pitch:b.quick_pitch,business_type:b.business_type}:null;
 if(valid(state))return valid(state);
 if(!enabled)return null;
 try{return valid(JSON.parse(sessionStorage.getItem(BRIEF_KEY)||'null'));}catch{return null;}
}
