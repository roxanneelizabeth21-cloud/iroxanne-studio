export const RUSH_TERMS = 'EXPEDITED PROJECT SCHEDULE\nThe target launch date is an expedited planning target. Work begins after the agreed deposit, content, and required access have been received. The client and iRoxanne Studio will agree on review dates and feedback deadlines before work starts. Delayed content, access, approvals, or changes to the agreed scope may move the launch date. Any additional fee or revised delivery date must be agreed in writing before the extra work proceeds. The payment, ownership, and revision provisions in the main agreement continue to apply.';
export function isRushDate(value: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const target = Date.parse(value + 'T00:00:00Z');
  const days = (target - today) / 86400000;
  return days >= 0 && days < 30;
}
export function defaultHandoff() {
  return [
    ['scope','Scope','Agreed features and pages delivered'],
    ['desktop','Testing','Desktop browsers tested'],
    ['mobile','Testing','Mobile layouts and navigation tested'],
    ['forms','Testing','Forms, notifications, and client workflows tested'],
    ['permissions','Testing','Admin and client access permissions verified'],
    ['payments','Testing','Payment flow verified, or documented as outside scope'],
    ['domain','Launch','Domain, branding, and production settings checked'],
    ['ownership','Access','Client ownership and required account access transferred securely'],
    ['backup','Access','Backup or export and recovery instructions provided'],
    ['guide','Documentation','User guide and maintenance instructions delivered'],
    ['training','Training','Client walkthrough completed or recording provided'],
    ['support','Support','Support period and contact process confirmed'],
  ].map(([id,category,label])=>({id,category,label,required:true,completed:false,notes:''}));
}
export function validateSignature(mode: string, image: unknown) {
  if (!['typed','drawn'].includes(mode)) return false;
  if (mode === 'typed') return true;
  if (typeof image !== 'string' || image.length > 180000 || !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(image)) return false;
  try { return atob(image.split(',')[1]).slice(0,8) === '\x89PNG\r\n\x1a\n'; } catch { return false; }
}
export function canCompleteHandoff(contract: any) {
  return contract.handoff_status === 'accepted' && Array.isArray(contract.handoff_items) && contract.handoff_items.length > 0 &&
    contract.handoff_items.every((x:any)=>!x.required || x.completed);
}
export function reminderDecision(invoice: any, outstanding: number, now = new Date()) {
  if (!invoice.reminder_enabled || ['paid','cancelled','draft'].includes(invoice.status) || outstanding <= 0) return 'skip';
  if ((invoice.reminder_sent_count || 0) >= (invoice.reminder_max_count || 3)) return 'limit';
  const next = Date.parse(invoice.reminder_next_at || '');
  if (!Number.isFinite(next) || next > now.getTime()) return 'wait';
  return 'send';
}
