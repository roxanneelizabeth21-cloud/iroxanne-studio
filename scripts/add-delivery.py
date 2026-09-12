import json
from pathlib import Path
def props(name,extra):
 p=Path('base44/entities/'+name+'.jsonc'); d=json.loads(p.read_text());d['properties'].update(extra);p.write_text(json.dumps(d,indent=2)+'\n')
s=lambda **kw:dict(type='string',**kw)
props('Contract',dict(signature_mode=s(enum=['typed','drawn'],default='typed'),signature_image=s(maxLength=180000),target_launch_date=s(format='date'),contract_variant=s(enum=['standard','rush'],default='standard'),rush_terms=s(maxLength=8000),handoff_status=s(enum=['draft','ready','accepted','changes_requested'],default='draft'),handoff_token=s(),handoff_internal_notes=s(maxLength=5000),handoff_client_notes=s(maxLength=3000),handoff_ack_name=s(),handoff_ack_at=s(format='date-time'),handoff_ack_ip=s(),handoff_ack_user_agent=s(),handoff_items=dict(type='array',items=dict(type='object',properties=dict(id=s(),category=s(),label=s(),required=dict(type='boolean'),completed=dict(type='boolean'),completed_at=s(),notes=s())))))
props('PricingSettings',dict(rush_terms=s(maxLength=8000)))
props('Invoice',dict(reminder_enabled=dict(type='boolean',default=False),reminder_stage=s(enum=['deposit','balance'],default='deposit'),reminder_next_at=s(format='date-time'),reminder_interval_days=dict(type='number',default=7,minimum=1,maximum=30),reminder_max_count=dict(type='number',default=3,minimum=1,maximum=10),reminder_sent_count=dict(type='number',default=0),reminder_state=s(enum=['idle','sending','error'],default='idle'),reminder_error=s(),reminder_last_attempt_at=s(format='date-time'),reminder_last_sent_at=s(format='date-time')))
def edit(path,a,b):
 p=Path(path);t=p.read_text();assert t.count(a)==1,(path,a[:100],t.count(a));p.write_text(t.replace(a,b))
edit('src/App.jsx',"import ContractSign from '@/pages/ContractSign';","import ContractSign from '@/pages/ContractSign';\nimport ProjectHandoff from '@/pages/ProjectHandoff';")
edit('src/App.jsx','<Route path="/contract/:id" element={<ContractSign />} />','<Route path="/contract/:id" element={<ContractSign />} />\n      <Route path="/handoff/:id" element={<ProjectHandoff />} />')
edit('base44/functions/clientContract/entry.ts',"// Public, token-verified","import { validateSignature } from '../../shared/studioDelivery.ts';\n\n// Public, token-verified")
edit('base44/functions/clientContract/entry.ts','const { id, token, action, signerName, consent }','const { id, token, action, signerName, consent, signatureMode = \'typed\', signatureImage }')
edit('base44/functions/clientContract/entry.ts',"if (!signerName || !signerName.trim())","if (!validateSignature(signatureMode, signatureImage)) return Response.json({error:'Please draw your signature or choose typed signature.'},{status:400});\n      if (typeof signerName !== 'string' || !signerName.trim())")
edit('base44/functions/clientContract/entry.ts','signer_name: signerName.trim(),',"signer_name: signerName.trim().slice(0,200),\n        signature_mode: signatureMode,\n        signature_image: signatureMode === 'drawn' ? signatureImage : '',")
# Hide private handoff data from contract-link visitors.
edit('base44/functions/clientContract/entry.ts','    if (contract.access_token !== token)',"    const publicContract = (c) => Object.fromEntries(Object.entries(c).filter(([k]) => !k.startsWith('handoff_') && !['signer_ip','signer_user_agent'].includes(k)));\n    if (contract.access_token !== token)")
edit('base44/functions/clientContract/entry.ts','return Response.json({ contract: updated });','return Response.json({ contract: publicContract(updated) });')
edit('base44/functions/clientContract/entry.ts','return Response.json({ contract });','return Response.json({ contract: publicContract(contract) });')
edit('src/pages/ContractSign.jsx',"const money =", "import SignaturePad from '@/components/SignaturePad';\n\nconst money =")
edit('src/pages/ContractSign.jsx',"const [agree, setAgree] = useState(false);","const [agree, setAgree] = useState(false);\n  const [signatureMode,setSignatureMode] = useState('typed');\n  const [signatureImage,setSignatureImage] = useState('');")
edit('src/pages/ContractSign.jsx','signerName, consent: agree','signerName, consent: agree, signatureMode, signatureImage')
edit('src/pages/ContractSign.jsx','min-h-screen bg-[#FAF7F0]','studio-surface min-h-screen bg-[#FAF7F0]')
edit('src/pages/ContractSign.jsx','          {signed ? (',"""          {contract.target_launch_date && <p className="text-sm">Target launch date: {contract.target_launch_date}</p>}
          {contract.contract_variant === 'rush' && <div><h2 className="font-semibold mb-2">Rush schedule addendum</h2><p className="text-sm whitespace-pre-wrap leading-6">{contract.rush_terms}</p></div>}
          {signed ? (""")
edit('src/pages/ContractSign.jsx','Agreement signed</p>','Agreement signed</p>\n              {contract.signature_mode === \'drawn\' && contract.signature_image && <img src={contract.signature_image} alt="Recorded signature" className="max-w-full w-72 mx-auto bg-[#FAF7F0] rounded-lg" />}')
edit('src/pages/ContractSign.jsx','Type your full legal name to sign','Full legal name')
edit('src/pages/ContractSign.jsx','              <label className="flex items-start gap-3 cursor-pointer">',"""              <fieldset className="space-y-3"><legend className="text-sm font-medium">Signature method</legend><div className="flex gap-5">{['typed','drawn'].map(mode=><label key={mode} className="flex gap-2"><input type="radio" name="signature-method" checked={signatureMode===mode} onChange={()=>setSignatureMode(mode)} />{mode==='typed'?'Type my signature':'Draw my signature'}</label>)}</div>{signatureMode==='drawn' && <SignaturePad onChange={setSignatureImage} disabled={signing}/>}</fieldset>
              <label className="flex items-start gap-3 cursor-pointer">""")
edit('src/pages/ContractSign.jsx','My typed name serves as my electronic signature.','My {signatureMode === \'drawn\' ? \'drawn signature\' : \'typed name\'} serves as my electronic signature.')
edit('src/pages/ContractSign.jsx','disabled={!signerName.trim() || !agree || signing}',"disabled={!signerName.trim() || !agree || signing || (signatureMode==='drawn' && !signatureImage)}")
edit('src/components/admin/ContractForm.jsx','const money =',"import { isRushDate, RUSH_TERMS } from '../../../base44/shared/studioDelivery';\n\nconst money =")
edit('src/components/admin/ContractForm.jsx','      <div className="space-y-1.5">\n        <Label>Scope of work</Label>',"""      <div className="grid sm:grid-cols-2 gap-4">
        <label className="space-y-1.5 text-sm">Target launch date<Input type="date" value={form.target_launch_date || ''} onChange={e=>setForm(p=>({...p,target_launch_date:e.target.value,contract_variant:isRushDate(e.target.value)?'rush':'standard',rush_terms:p.rush_terms || settings?.rush_terms || RUSH_TERMS}))}/></label>
        <label className="space-y-1.5 text-sm">Contract schedule<select className="w-full rounded-md border bg-background p-2" value={form.contract_variant || 'standard'} onChange={e=>update('contract_variant',e.target.value)}><option value="standard">Standard</option><option value="rush">Rush / expedited</option></select></label>
      </div>
      <p className="text-xs text-muted-foreground">Dates under 30 days away select rush terms. You can change the selection. Pricing stays as entered below.</p>
      {form.contract_variant==='rush' && <label className="block text-sm space-y-2">Rush schedule addendum<Textarea rows={7} maxLength={8000} value={form.rush_terms || ''} onChange={e=>update('rush_terms',e.target.value)}/></label>}
      <div className="space-y-1.5">
        <Label>Scope of work</Label>""")
edit('src/components/admin/ContractForm.jsx','return { ...initial };',"return { contract_variant:'standard',rush_terms:settings?.rush_terms || RUSH_TERMS,...initial };")
edit('src/components/admin/ContractForm.jsx',"    terms: settings?.standard_terms || '',","    terms: settings?.standard_terms || '',\n    contract_variant: 'standard',\n    rush_terms: settings?.rush_terms || RUSH_TERMS,")
edit('src/components/admin/ContractForm.jsx','disabled={saving || !form.client_email || !form.project_title}',"disabled={saving || !form.client_email || !form.project_title || (form.contract_variant==='rush' && !form.rush_terms?.trim())}")
# Snapshot candidate IDs before updates so pagination cannot skip records.
edit('base44/functions/processPaymentReminders/entry.ts','    // Pagination ensures older invoices are considered too.','    const candidates=[];\n    // Read a stable candidate list before any flags are changed.')
edit('base44/functions/processPaymentReminders/entry.ts','      for(const row of invoices) {','      candidates.push(...invoices);\n      if(invoices.length<100)break;\n    }\n      for(const row of candidates) {')
edit('base44/functions/processPaymentReminders/entry.ts','      if(invoices.length<100)break;\n    }\n    return Response.json','    return Response.json')
print('Delivery schemas, signatures and rush form integrated.')
