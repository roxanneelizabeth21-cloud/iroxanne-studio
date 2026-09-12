from pathlib import Path
import json
p=Path('src/components/admin/ContractForm.jsx');s=p.read_text().replace('if (initial && initial.id) {',"if (initial && initial.id && initial.quick_pitch === undefined && initial.client_email) {").replace("lead_id: initial?.lead_id || '',","lead_id: initial?.lead_id || initial?.id || '',")
s=s.replace('deposit_amount: computeDeposit(total),','deposit_amount: computeDeposit(total),\n      deposit_percent: form.deposit_percent ?? settings?.default_deposit_percent ?? 50,')
s=s.replace('Deposit ({settings?.default_deposit_percent ?? 50}%)','Deposit ({form.deposit_percent ?? settings?.default_deposit_percent ?? 50}%)')
p.write_text(s)
p=Path('src/components/admin/ProposalForm.jsx');s=p.read_text().replace('<Label>Valid until</Label>\n          <Input type="date" value={form.valid_until || \'\'} onChange={(e) => update(\'valid_until\', e.target.value)} />','<Label>Proposal validity</Label>\n          <p className="text-sm py-2">{settings?.proposal_valid_days ?? 3} days from sending. Change this in contract pricing settings.</p>')
s=s.replace("const valid = form.client_email?.includes('@') && form.project_title?.trim();","const valid = form.client_email?.includes('@') && form.project_title?.trim() && total > 0 && form.deposit_percent >= 0 && form.deposit_percent <= 100 && form.line_items.every(li => li.description?.trim() && Number.isFinite(li.amount) && li.amount >= 0);")
p.write_text(s)
p=Path('base44/functions/sendProposal/entry.ts');s=p.read_text().replace("    // Reuse the existing token","    if (!Number.isFinite(proposal.price_total) || proposal.price_total <= 0 || !Number.isFinite(proposal.deposit_percent) || proposal.deposit_percent < 0 || proposal.deposit_percent > 100) return Response.json({error:'Review proposal pricing and deposit before sending.'},{status:400});\n    // Reuse the existing token")
p.write_text(s)
p=Path('scripts/workflow-checks.mjs');s=p.read_text().replace("status:'draft',client_email:'test@example.test',project_title:'Test'","status:'draft',client_email:'test@example.test',project_title:'Test',price_total:1500,deposit_percent:50");p.write_text(s)
p=Path('src/pages/admin/ContractsAdminPage.jsx');s=p.read_text().replace("<ContractForm\n              initial=","<ContractForm\n              key={editing.contract?.id || editing.lead?.id || 'new'}\n              initial=")
s=s.replace('      setEditing((prev) => (prev?.contract ? { contract: prev.contract } : null));','      setEditing(null);')
s=s.replace("const saveSettings = async (s) => {","const saveSettings = async (s) => {\n    s = {...s,packages:(s.packages || []).map(p=>({...p,name:p.name.trim()})),addons:(s.addons || []).map(a=>({...a,name:a.name.trim()}))};")
s=s.replace("                {['signed', 'deposit_paid', 'active'].includes(c.status) && (","""                {c.status === 'active' && <Button variant="outline" size="sm" onClick={async () => {
                  if (!window.confirm('Confirm the app has been delivered and the client handoff is complete. Payment status is tracked separately.')) return;
                  try { await base44.entities.Contract.update(c.id,{status:'completed',delivered_at:new Date().toISOString()}); toast({title:'Project marked delivered'}); await load(); }
                  catch(e){ toast({title:'Could not update project',description:e.message,variant:'destructive'}); }
                }}>Mark delivered</Button>}
                {['signed', 'deposit_paid', 'active'].includes(c.status) && (""")
p.write_text(s)
p=Path('base44/entities/Contract.jsonc');s=json.loads(p.read_text());s['properties']['delivered_at']={'type':'string','format':'date-time'};p.write_text(json.dumps(s,indent=2))
p=Path('base44/shared/emailBrand.ts');s=p.read_text().replace('${url}" style=','${esc(url)}" style=').replace(".replace(/>/g, '&gt;');",".replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;');");p.write_text(s)
p=Path('base44/functions/clientProposal/entry.ts');s=p.read_text().replace("let contractId = proposal.contract_id || '';","const previous = await base44.asServiceRole.entities.Contract.filter({proposal_id:id});\n      let contractId = proposal.contract_id || previous[0]?.id || '';");p.write_text(s)
print('Final workflow refinements complete')
