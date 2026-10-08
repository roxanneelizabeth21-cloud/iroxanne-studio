// Default "what we need from you" checklist. Roxanne can add, edit or remove
// items per client in Admin > Client intakes before anything is sent.
// Anything the quote form already answered is NOT asked again: the first three
// items appear only when the quote left them blank.
export function defaultRequests(lead: any = {}, contract: any = {}) {
  const item = (id: string, label: string, help: string, kind: 'text' | 'file', answer = '', required = false) =>
    ({ id, label, help, kind, required, answer, file_urls: [] as string[] });
  const known = (v: any) => String(v || '').trim().length > 0;
  const list: any[] = [];
  if (!known(lead.business_name) && !known(contract.client_business)) {
    list.push(item('business_name', 'Business or project name', 'A working name is fine.', 'text', ''));
  }
  if (!known(lead.approver_name)) {
    list.push(item('approver', 'Who approves the work on your side?', 'The person who signs off on designs and changes.', 'text', contract.client_name || ''));
  }
  if (!known(lead.compliance_requirements)) {
    list.push(item('compliance', 'Rules or regulations your business must follow', 'For example HIPAA. Write "none" or "not sure" if that applies.', 'text', ''));
  }
  list.push(
    item('logo', 'Logo', 'Skip if you do not have one yet.', 'file'),
    item('brand', 'Colors, fonts or style you like', 'A few words or links are fine.', 'text', ''),
    item('photos', 'Photos or other files to use', 'Optional.', 'file'),
    item('documents', 'Policies, terms or other documents', 'Only if you already have them.', 'file'),
    item('other', 'Anything else I should know', '', 'text'),
  );
  return list;
}
