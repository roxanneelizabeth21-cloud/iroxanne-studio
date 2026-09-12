from pathlib import Path
def edit(path,a,b):
 p=Path(path);t=p.read_text();assert t.count(a)==1,(path,a[:100],t.count(a));p.write_text(t.replace(a,b))
p='src/pages/admin/ContractsAdminPage.jsx'
edit(p,"const money =", "import HandoffPanel from '@/components/admin/HandoffPanel';\nimport { RUSH_TERMS } from '../../../base44/shared/studioDelivery';\n\nconst money =")
edit(p,"const [saving, setSaving] = useState(false);","const [saving, setSaving] = useState(false);\n  const [handoff,setHandoff] = useState(null);")
edit(p,"const { id, ...changes } = payload;","const { id, ...changes } = payload;\n        const latest=await base44.entities.Contract.get(id);\n        if(!['draft','sent'].includes(latest.status))throw new Error('Signed agreements cannot be edited. Create a new agreement for changed terms.');")
edit(p,'<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({ contract: c })}>','<Button disabled={![\'draft\',\'sent\'].includes(c.status)} title="Edit unsigned agreement" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({ contract: c })}>')
a="""{c.status === 'active' && <Button variant="outline" size="sm" onClick={async () => {
                  if (!window.confirm('Confirm the app has been delivered and the client handoff is complete. Payment status is tracked separately.')) return;
                  try { await base44.entities.Contract.update(c.id,{status:'completed',delivered_at:new Date().toISOString()}); toast({title:'Project marked delivered'}); await load(); }
                  catch(e){ toast({title:'Could not update project',description:e.message,variant:'destructive'}); }
                }}>Mark delivered</Button>}"""
edit(p,a,"""{['signed','deposit_paid','active','completed'].includes(c.status) && <Button variant="outline" size="sm" onClick={()=>setHandoff(c)}>Handoff checklist</Button>}""")
edit(p,'<div className="flex gap-1 shrink-0">','<div className="flex flex-wrap gap-1 justify-end">')
edit(p,'      <Dialog open={!!editing}',"""      <Dialog open={!!handoff} onOpenChange={o=>!o&&setHandoff(null)}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Project handoff — {handoff?.project_title}</DialogTitle></DialogHeader>{handoff&&<HandoffPanel contractId={handoff.id} onSaved={load}/>}</DialogContent></Dialog>
      <Dialog open={!!editing}""")
edit(p,'      <div className="flex justify-end">\n        <Button onClick={() => onSave(s)}>Save Settings</Button>',"""      <label className="block text-sm space-y-2">Rush terms (pre-filled on new agreements)<Textarea rows={7} maxLength={8000} value={s.rush_terms ?? RUSH_TERMS} onChange={e=>update('rush_terms',e.target.value)}/></label>
      <div className="flex justify-end">
        <Button onClick={() => onSave({...s,rush_terms:s.rush_terms ?? RUSH_TERMS})}>Save Settings</Button>""")
p='src/pages/admin/InvoicesAdminPage.jsx'
edit(p,"const money =", "import InvoiceReminderSettings from '@/components/admin/InvoiceReminderSettings';\nconst money =")
edit(p,'      <details className="text-sm">','      <InvoiceReminderSettings key={i.id+\'-\'+i.updated_date} invoice={i} onSaved={load}/>\n      <details className="text-sm">')
print('Admin controls connected.')
