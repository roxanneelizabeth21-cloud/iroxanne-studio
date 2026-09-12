from pathlib import Path
p='base44/functions/sendProposal/entry.ts'
s=Path(p).read_text();start=s.index('  const chars =');end=s.index('\n}',start);s=s[:start]+"  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');"+s[end:]
s=s.replace("return url.origin.includes('base44') ? url.origin : 'https://iroxanne.com';","return 'https://iroxannestudio.base44.app';")
s=s.replace("    // Reuse the existing token", """    if (['accepted', 'declined'].includes(proposal.status)) return Response.json({ error: 'Create a new proposal for a completed response.' }, { status: 409 });
    const settingsList = await base44.entities.PricingSettings.list('-updated_date');
    const settings = settingsList.find((s: any) => s.packages?.length) || settingsList[0];
    const validDays = Math.max(1, Number(settings?.proposal_valid_days) || 3);
    const refresh = ['draft', 'changes_requested', 'expired'].includes(proposal.status) || !proposal.expires_at;
    const expiresAt = refresh ? new Date(Date.now() + validDays * 86400000).toISOString() : proposal.expires_at;
    if (new Date(expiresAt).getTime() <= Date.now()) return Response.json({ error: 'Edit this expired proposal before resending.' }, { status: 409 });
    // Reuse the existing token""")
s=s.replace("status: proposal.status === 'draft' ? 'sent' : proposal.status,","status: 'sent',\n      expires_at: expiresAt,\n      valid_until: expiresAt.slice(0, 10),\n      proposal_number: proposal.proposal_number || 'IR-' + new Date().getFullYear() + '-' + proposal_id.toUpperCase(),")
s=s.replace("${proposal.valid_until ?","${expiresAt ?").replace("${esc(proposal.valid_until)}","${esc(new Date(expiresAt).toUTCString())}")
Path(p).write_text(s)
p='base44/functions/clientProposal/entry.ts';s=Path(p).read_text().replace('action, decline_reason','action, decline_reason, change_request')
s=s.replace("const expired = proposal.valid_until && new Date(proposal.valid_until) < new Date() &&","const expiry = proposal.expires_at || proposal.valid_until;\n    const expired = expiry && new Date(expiry) <= new Date() &&")
s=s.replace("    if (expired) return", """    if (!['sent', 'viewed', 'changes_requested', 'accepted', 'declined'].includes(proposal.status)) return Response.json({ error: 'This proposal is not open for responses.' }, { status: 409 });
    if (expired) return""")
s=s.replace("    if (action === 'decline') {", """    if (action === 'request_changes') {
      if (!['sent', 'viewed'].includes(proposal.status)) return Response.json({ error: 'This proposal cannot accept change requests right now.' }, { status: 409 });
      if (typeof change_request !== 'string' || !change_request.trim()) return Response.json({ error: 'Please describe the changes you need.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.Proposal.update(id, { status: 'changes_requested', change_request: change_request.trim().slice(0, 2000), changes_requested_at: now });
      const adminEmail = await resolveAdminEmail(base44).catch(() => '');
      if (adminEmail) await base44.asServiceRole.integrations.Core.SendEmail({
        to: adminEmail, subject: 'Proposal changes requested — ' + updated.project_title,
        html: brandedEmail({ title: 'Changes requested', content: '<p>' + esc(updated.client_name || updated.client_email) + ' requested:</p><p>' + esc(updated.change_request) + '</p>' }),
      }).catch(() => {});
      return Response.json({ proposal: updated });
    }
    if (proposal.status === 'changes_requested') return Response.json({ error: 'Your changes are being reviewed. Please wait for the revised proposal.' }, { status: 409 });
    if (action === 'decline') {""")
s=s.replace("lead_id: proposal.lead_id || '',","proposal_id: id,\n          lead_id: proposal.lead_id || '',")
s=s.replace("scope_summary: proposal.scope_summary || '',","scope_summary: [proposal.scope_summary || '', ...(proposal.deliverables || []).map((d: string) => '• ' + d), proposal.timeline_estimate ? 'Timeline: ' + proposal.timeline_estimate : ''].filter(Boolean).join('\\n\\n'),")
Path(p).write_text(s)
p='src/pages/ProposalView.jsx';s=Path(p).read_text().replace("const [declineReason, setDeclineReason] = useState('');","const [declineReason, setDeclineReason] = useState('');\n  const [changeRequest, setChangeRequest] = useState('');")
s=s.replace("action,\n        decline_reason:","action,\n        change_request: action === 'request_changes' ? changeRequest : undefined,\n        decline_reason:")
s=s.replace('const settled = accepted || declined;',"const changesRequested = proposal.status === 'changes_requested';\n  const expiry = proposal.expires_at || proposal.valid_until;\n  const expired = expiry && new Date(expiry) <= new Date();\n  const settled = accepted || declined || changesRequested || expired;")
s=s.replace('new Date(proposal.valid_until).toLocaleDateString()','new Date(expiry).toLocaleString()')
s=s.replace('          {!settled && (',"""          {changesRequested && <div className="rounded-xl border border-border p-5"><h2 className="font-semibold">Your change request is saved</h2><p className="mt-2 whitespace-pre-wrap">{proposal.change_request}</p><p className="text-sm mt-3">I'll review it and send a revised proposal.</p></div>}
          {expired && !accepted && !declined && <p role="status">This proposal has expired. Please contact me for an updated proposal.</p>}
          {!settled && (""")
s=s.replace('                  <button\n                    onClick={() => setShowDecline(true)}',"""                  <div className="space-y-2 pt-4">
                    <label htmlFor="proposal-changes" className="text-sm font-medium">Need something adjusted?</label>
                    <Textarea id="proposal-changes" value={changeRequest} onChange={(e) => setChangeRequest(e.target.value)} maxLength={2000} placeholder="Describe any changes to scope, timing, or pricing." />
                    <Button variant="outline" disabled={!!working || !changeRequest.trim()} onClick={() => act('request_changes')}>Request changes</Button>
                  </div>
                  <button
                    onClick={() => setShowDecline(true)}""")
Path(p).write_text(s)
p='src/pages/admin/ProposalsAdminPage.jsx';s=Path(p).read_text().replace("  draft: 'bg-secondary","  changes_requested: 'bg-amber-500/10 text-amber-700',\n  draft: 'bg-secondary")
s=s.replace("const { id, ...changes } = payload;","const { id, ...changes } = payload;\n        changes.status = 'draft';")
s=s.replace("{p.business_name || p.client_name || p.client_email} ·", "{p.proposal_number ? p.proposal_number + ' · ' : ''}{p.business_name || p.client_name || p.client_email} ·")
s=s.replace('              <div className="flex gap-1 shrink-0 items-center">','              {p.change_request && <p className="text-sm whitespace-pre-wrap max-w-sm">Requested changes: {p.change_request}</p>}\n              <div className="flex gap-1 shrink-0 items-center">')
Path(p).write_text(s)
p='base44/functions/clientContract/entry.ts';s=Path(p).read_text().replace('action, signerName','action, signerName, consent')
s=s.replace("    if (action === 'sign') {","    if (action === 'sign') {\n      if (contract.status !== 'sent') return Response.json({ error: 'This agreement is not open for signature.' }, { status: 409 });\n      if (consent !== true) return Response.json({ error: 'Please confirm your agreement to sign electronically.' }, { status: 400 });")
s=s.replace('signer_ip: ip','signer_ip: ip,\n        signature_consent: true,\n        signer_user_agent: (req.headers.get(\'user-agent\') || \'\').slice(0, 1000)')
Path(p).write_text(s)
p='src/pages/ContractSign.jsx';s=Path(p).read_text().replace("action: 'sign', signerName","action: 'sign', signerName, consent: agree");Path(p).write_text(s)
p='src/pages/admin/ContractsAdminPage.jsx';s=Path(p).read_text().replace("const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);","if (!['draft', 'sent'].includes(contract.status)) return;\n    const token = contract.access_token || Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');");Path(p).write_text(s)
p='base44/functions/recordPayment/entry.ts';s=Path(p).read_text().replace("    // Roll the contract forward: deposit in = active, fully paid = completed.","    // Payment and delivery are separate: paying never completes a project.")
s=s.replace("""        if (settled && !['completed', 'cancelled'].includes(contract.status)) {
          changes.status = 'completed';
        } else if ((depositStatus === 'paid' || depositStatus === 'waived') &&""","""        if ((depositStatus === 'paid' || depositStatus === 'waived') &&""")
s=s.replace("['sent', 'signed', 'deposit_paid'].includes(contract.status)","['signed', 'deposit_paid'].includes(contract.status)")
s=s.replace("const payments = (await base44.entities.Payment.filter({ invoice_id }).catch(() => [])) || [];","const payments = (await base44.entities.Payment.filter({ invoice_id })) || [];")
Path(p).write_text(s)
print('Proposal and signature flow updated')
