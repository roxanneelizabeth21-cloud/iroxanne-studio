from pathlib import Path
import json
def edit(p,a,b):
 s=Path(p).read_text()
 assert s.count(a)==1,(p,s.count(a),a[:60])
 Path(p).write_text(s.replace(a,b))
edit('src/App.jsx',"import ContractSign from '@/pages/ContractSign';","import ContractSign from '@/pages/ContractSign';\nimport ProposalView from '@/pages/ProposalView';\nimport ProposalsAdminPage from '@/pages/admin/ProposalsAdminPage';")
edit('src/App.jsx','<Route path="/contract/:id" element={<ContractSign />} />','<Route path="/contract/:id" element={<ContractSign />} />\n      <Route path="/proposal/:id" element={<ProposalView />} />')
edit('src/App.jsx','<Route path="/admin/contracts" element={<ContractsAdminPage />} />','<Route path="/admin/contracts" element={<ContractsAdminPage />} />\n        <Route path="/admin/proposals" element={<ProposalsAdminPage />} />')
edit('src/components/admin/AdminLayout.jsx',"  { to: '/admin/contracts', label: 'Contracts', Icon: FileText },","  { to: '/admin/proposals', label: 'Quotes & Proposals', Icon: FileText },\n  { to: '/admin/contracts', label: 'Contracts', Icon: FileText },")
for p in ['src/pages/admin/ContractsAdminPage.jsx','src/pages/admin/ProposalsAdminPage.jsx']:
 edit(p,'setSettings(settingsList[0] || null);',"setSettings(settingsList.find((s) => s.packages?.length) || settingsList[0] || null);")
for p in ['base44/functions/clientProposal/entry.ts','base44/functions/sendInvoice/entry.ts']:
 edit(p,"const settings = (await base44.asServiceRole.entities.PricingSettings.list().catch(() => []))[0];","const settingsList = await base44.asServiceRole.entities.PricingSettings.list('-updated_date');\n      const settings = settingsList.find((s: any) => s.packages?.length) || settingsList[0];")
edit('src/components/admin/ProposalForm.jsx','settings?.proposal_valid_days ?? 14','settings?.proposal_valid_days ?? 3')
edit('src/components/admin/ProposalForm.jsx',"p.name?.toLowerCase() === String(tier).toLowerCase()","p.name?.trim().toLowerCase() === String(tier).trim().toLowerCase()")
edit('src/components/admin/ProposalForm.jsx','Math.round((total * num(form.deposit_percent)) / 100)','Math.round(total * num(form.deposit_percent)) / 100')
edit('src/components/admin/ContractForm.jsx','Math.round((p * pct) / 100)','Math.round(p * pct) / 100')
edit('src/components/admin/ContractForm.jsx','const pct = settings?.default_deposit_percent ?? 50;','const pct = form.deposit_percent ?? settings?.default_deposit_percent ?? 50;')
p='base44/entities/PricingSettings.jsonc';s=json.loads(Path(p).read_text());s['properties']['proposal_valid_days']['default']=3;Path(p).write_text(json.dumps(s,indent=2))
p='base44/entities/Proposal.jsonc';s=json.loads(Path(p).read_text());s['properties']['status']['enum'].append('changes_requested');s['properties'].update({'change_request':{'type':'string','maxLength':2000},'changes_requested_at':{'type':'string','format':'date-time'},'expires_at':{'type':'string','format':'date-time'},'proposal_number':{'type':'string'}});Path(p).write_text(json.dumps(s,indent=2))
p='base44/entities/Contract.jsonc';s=json.loads(Path(p).read_text());s['properties'].update({'signature_consent':{'type':'boolean'},'signer_user_agent':{'type':'string'},'proposal_id':{'type':'string'}});Path(p).write_text(json.dumps(s,indent=2))
print('Routes, pricing, schemas updated')
