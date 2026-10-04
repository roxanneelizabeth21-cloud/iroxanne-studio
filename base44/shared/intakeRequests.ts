// Default "what we need from you" checklist. Roxanne can add, edit or remove
// items per client in Admin > Client intakes before anything is sent.
export function defaultRequests(lead: any = {}, contract: any = {}) {
  const item = (id: string, label: string, help: string, kind: 'text' | 'file', answer = '', required = false) =>
    ({ id, label, help, kind, required, answer, file_urls: [] as string[] });
  return [
    item('business_name', 'Business or project name', 'Confirm the name you want shown.', 'text', lead.business_name || contract.client_business || ''),
    item('approver', 'Who approves the work on your side?', 'The person who signs off on designs and changes.', 'text', lead.approver_name || contract.client_name || ''),
    item('compliance', 'Rules or regulations your business must follow', 'For example HIPAA. Write "none" or "not sure" if that applies.', 'text', lead.compliance_requirements || ''),
    item('platform_account_email', 'Base44 account email', 'Your finished app is transferred to this account. A free account is enough for now.', 'text', lead.platform_account_email || ''),
    item('logo', 'Logo', 'Skip if you do not have one yet.', 'file'),
    item('brand', 'Colors, fonts or style you like', 'A few words or links are fine.', 'text', ''),
    item('photos', 'Photos or other files to use', 'Optional.', 'file'),
    item('documents', 'Policies, terms or other documents', 'Only if you already have them.', 'file'),
    item('other', 'Anything else I should know', '', 'text'),
  ];
}
