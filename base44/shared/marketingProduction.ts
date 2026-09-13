export function productionSlots(now = new Date()) {
 const day = new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const d = new Date(day+'T12:00:00Z');
 // Prepare the next full Monday–Sunday week: four ideas, eight platform variants.
 const untilMonday = ((8-d.getUTCDay())%7)||7;
 d.setUTCDate(d.getUTCDate()+untilMonday);
 return [0,2,4,6].map((offset,index)=>{ const x=new Date(d);x.setUTCDate(x.getUTCDate()+offset);return {date:x.toISOString().slice(0,10),index}; });
}
export function validateCopy(c) {
 if (!c || !['facebook','instagram','image_prompt'].every(k=>typeof c[k]==='string' && c[k].trim().length>20)) throw new Error('Incomplete copy or image direction');
 if (c.facebook.length>4000 || c.instagram.length>2000) throw new Error('Caption too long');
 if (/base44|no.code|guarantee|\$\d|testimonial/i.test(c.facebook+' '+c.instagram)) throw new Error('Needs personal review: technical, pricing or sensitive claims');
}
