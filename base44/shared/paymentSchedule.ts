export function withHandoffTerms(terms:unknown) {
  const text=String(terms || '').trim();
  const clause='Full app handoff, including transfer of the completed app and administrative access, takes place only after all agreed project payments have been received in full.';
  const currentAgreement = text.includes('Full ownership and administrative handoff occur only after completion and payment in full under Sections 9 and 10.');
  return text.includes(clause) || currentAgreement ? text : [text,clause].filter(Boolean).join('\n\n');
}
export type Installment = {label:string; amount:number; due_date:string};
export function validateSchedule(rows:any, total:number): Installment[] {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 7) throw new Error('Choose between one and seven payments, including the deposit.');
  const cents = Math.round(Number(total)*100);
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('Project total must be positive.');
  let sum=0, previous='';
  return rows.map((r:any,i:number)=>{
    const amount=Number(r.amount), n=Math.round(amount*100), date=String(r.due_date || '');
    if (!Number.isSafeInteger(n) || n<=0 || Math.abs(amount*100-n)>0.000001) throw new Error('Every payment needs a positive amount with at most two decimal places.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date) throw new Error('Every payment needs a valid due date.');
    if (previous && date<=previous) throw new Error('Payment dates must be in order, on different days.');
    previous=date; sum+=n;
    if (i===rows.length-1 && sum!==cents) throw new Error('Payments must add up exactly to the project total.');
    return {label: i===0 ? (rows.length===1?'Full payment':'Deposit') : String(r.label || 'Payment '+(i+1)).slice(0,100), amount:n/100, due_date:date};
  });
}
export function scheduleText(rows:Installment[]) {
  return rows.map((r,i)=>`${i+1}. ${r.label}: $${r.amount.toFixed(2)} due ${r.due_date}`).join('\n') + '\nThese agreed amounts and dates control the payment timing if general payment terms differ. Payments are not automatically charged.';
}
export function squareRequests(rows:Installment[]) {
  return rows.map((r,i)=>({
    uid:'studio-payment-'+(i+1),
    request_type: rows.length===1 || (rows.length===2 && i===1) ? 'BALANCE' : i===0 ? 'DEPOSIT' : 'INSTALLMENT',
    ...((rows.length===1 || (rows.length===2 && i===1)) ? {} : {fixed_amount_requested_money:{amount:Math.round(r.amount*100),currency:'USD'}}),
    due_date:r.due_date, automatic_payment_source:'NONE', tipping_enabled:false,
    reminders:[{relative_scheduled_days:-1,message:'A friendly reminder: your project payment is due tomorrow.'},{relative_scheduled_days:3,message:'Your project payment is overdue. Please contact iRoxanne Studio if you need help.'}]
  }));
}
