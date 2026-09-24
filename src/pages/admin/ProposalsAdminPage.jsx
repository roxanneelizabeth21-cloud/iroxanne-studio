import { MoreActions } from '@/components/admin/WorkflowSection';
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Plus, Send, Copy, Pencil, ChevronDown, ChevronRight, ArrowRight, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import ProposalForm from '@/components/admin/ProposalForm';
import { useConfirmDelete } from '@/components/admin/ConfirmDeleteDialog';
import { deleteProjectChain, chainSummary } from '@/lib/projectChain';

const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

const STATUS_BADGE = {
  changes_requested: 'irx-badge irx-accent-gold',
  draft: 'irx-badge',
  sent: 'irx-badge irx-accent-blue',
  viewed: 'irx-badge irx-accent-gold',
  accepted: 'irx-badge irx-accent-green',
  declined: 'irx-badge irx-accent-rose',
  expired: 'irx-badge irx-accent-rose',
};

export default function ProposalsAdminPage() {
  const { toast } = useToast();
  const { confirm: confirmDelete, dialog: confirmDialog } = useConfirmDelete();
  const [leads, setLeads] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showLeads, setShowLeads] = useState(true);
  const [saving, setSaving] = useState(false);
  const [params] = useSearchParams();
  const requestedLead=params.get('lead'),requestedProposal=params.get('proposal');
  const [leadReview,setLeadReview]=useState(null);
  useEffect(()=>{
    if(!requestedLead&&!requestedProposal)return;
    let cancelled=false;
    (requestedLead?base44.entities.Lead.get(requestedLead):base44.entities.Proposal.get(requestedProposal))
      .then(record=>{if(!cancelled){if(requestedLead)setLeadReview(record);else setEditing({proposal:record});}})
      .catch(()=>toast({title:'Project record could not be loaded',variant:'destructive'}));
    return()=>{cancelled=true;};
  },[requestedLead,requestedProposal]);
  const saveReview=async()=>{
    setSaving(true);
    try{await base44.entities.Lead.update(leadReview.id,{description:leadReview.description||'',status:leadReview.status});toast({title:'Request review saved'});await load();}
    catch(e){toast({title:'Could not save review',description:e.message,variant:'destructive'});}
    finally{setSaving(false);}
  };

  const load = async () => {
    setLoading(true);
    try {
      const [leadList, proposalList, settingsList] = await Promise.all([
        base44.entities.Lead.filter({ status: {$in:['new','contacted']} }),
        base44.entities.Proposal.list('-created_date', 50).catch(() => []),
        base44.entities.PricingSettings.list('-updated_date', 1).catch(() => []),
      ]);
      setLeads(leadList.filter(l=>!l.is_test_record));
      setProposals(proposalList);
      setSettings(settingsList.find((s) => s.packages?.length) || settingsList[0] || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (payload.id) {
        const { id, ...changes } = payload;
        const current=await base44.entities.Proposal.get(id);
        if(current.status==='accepted'||current.contract_id)throw new Error('Accepted proposals are preserved. Create a new proposal for changed scope.');
        changes.status = 'draft';
        await base44.entities.Proposal.update(id, changes);
        toast({ title: 'Proposal updated' });
        setEditing(null);
      } else {
        const created = await base44.entities.Proposal.create(payload);
        toast({ title: 'Proposal created', description: 'Review it, then hit Send.' });
        setEditing({ proposal: created });
      }
      await load();
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (proposal) => {
    try {
      const res = await base44.functions.invoke('sendProposal', { proposal_id: proposal.id });
      const data = res.data || res;
      if (data.error) { toast({ title: data.error, variant: 'destructive' }); return; }
      await navigator.clipboard.writeText(data.link).catch(() => {});
      toast({
        title: data.sent ? `Proposal emailed to ${proposal.client_email}` : 'Link copied — email failed',
        description: data.sent ? 'Link also copied to your clipboard.' : 'Paste the link to your client manually.',
      });
      await load();
    } catch (e) {
      toast({ title: 'Failed to send proposal', description: e.message, variant: 'destructive' });
    }
  };

  const copyLink = (p) => {
    navigator.clipboard.writeText(`https://iroxannestudio.com/proposal/${p.id}?t=${p.access_token}`);
    toast({ title: 'Proposal link copied' });
  };

  const handleDelete = async (proposal) => {
    const ok = await confirmDelete({
      title: 'Delete this proposal?',
      description: `"${proposal.project_title}" will be permanently removed, along with any agreement created from it. This cannot be undone.`,
    });
    if (!ok) return;
    try {
      const counts = await deleteProjectChain('proposal', proposal.id);
      toast({ title: 'Proposal deleted', description: chainSummary(counts) });
      await load();
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteLead = async (lead) => {
    const ok = await confirmDelete({
      title: 'Delete this quote request?',
      description: `The request from "${lead.name || lead.email}" will be permanently removed, along with any proposals or agreements created from it. This cannot be undone.`,
    });
    if (!ok) return;
    try {
      const counts = await deleteProjectChain('lead', lead.id);
      toast({ title: 'Quote request deleted', description: chainSummary(counts) });
      await load();
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="irx-page-header">
        <div className="irx-eyebrow">Business Manager</div>
        <h1>Quotes &amp; Proposals</h1>
        <p>Create, send, and track client proposals.</p>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary, #66736e)' }}>
        Review each inquiry, record your consultation notes, then prepare an itemized proposal. Only approved scope and prices move into the agreement.
      </p>

      {/* Lead review dialog */}
      <Dialog open={!!leadReview} onOpenChange={o=>!o&&setLeadReview(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Review quote request</DialogTitle></DialogHeader>
          {leadReview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p>{leadReview.name} · {leadReview.email}</p>
              {['selected_package','quick_pitch','problem_to_solve','must_have_features','nice_to_have_features','integrations_needed','existing_tools','ideal_launch_date','budget_range'].map(key => (
                <div key={key}>
                  <h3 style={{ fontWeight: 500, textTransform: 'capitalize' }}>{key.replaceAll('_',' ')}</h3>
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '13px' }}>
                    {Array.isArray(leadReview[key]) ? leadReview[key].join(', ') : leadReview[key] || 'Not provided'}
                  </p>
                </div>
              ))}
              <label style={{ display: 'block', fontSize: '13px' }}>
                Internal consultation notes
                <textarea
                  style={{ display: 'block', width: '100%', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', padding: '8px', marginTop: '8px' }}
                  maxLength={1000}
                  value={leadReview.description || ''}
                  onChange={e => setLeadReview({ ...leadReview, description: e.target.value })}
                />
              </label>
              <label style={{ display: 'block', fontSize: '13px' }}>
                Request status
                <select
                  style={{ marginLeft: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', padding: '8px' }}
                  value={leadReview.status}
                  onChange={e => setLeadReview({ ...leadReview, status: e.target.value })}
                >
                  {['new','contacted','proposal_sent','won','lost','archived'].map(s => (
                    <option key={s} value={s}>{s.replaceAll('_',' ')}</option>
                  ))}
                </select>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button disabled={saving} onClick={saveReview}>Save review</Button>
                <Button variant="outline" onClick={() => { setEditing({ lead: leadReview }); setLeadReview(null); }}>Build proposal</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New quote requests */}
      <div className="irx-card" style={{ padding: '20px' }}>
        <button onClick={() => setShowLeads((v) => !v)} className="irx-section-head" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {showLeads ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <h2 style={{ fontWeight: 600, margin: 0 }}>New Quote Requests ({leads.length})</h2>
        </button>
        {showLeads && (
          <div className="irx-list" style={{ marginTop: '12px' }}>
            {loading && <p style={{ fontSize: '13px', color: 'var(--text-secondary, #66736e)' }}>Loading…</p>}
            {!loading && leads.length === 0 && (
              <div className="irx-empty">
                <p>No new quote requests.</p>
              </div>
            )}
            {leads.map((lead) => (
              <div key={lead.id} className="irx-card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '16px', background: 'var(--secondary-subtle, var(--secondary, rgba(0,0,0,0.03)))' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 500, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.name || lead.email}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.business_name ? `${lead.business_name} · ` : ''}{lead.quick_pitch?.slice(0, 80) || 'No pitch'}
                  </p>
                  {lead.estimated_price_low != null && (
                    <p style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '2px' }}>
                      Est. {money(lead.estimated_price_low)}–{money(lead.estimated_price_high)}
                      {lead.estimated_tier ? ` · ${lead.estimated_tier}` : ''}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <Button size="sm" onClick={() => setLeadReview(lead)} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Review Request
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete" onClick={() => handleDeleteLead(lead)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proposals */}
      <div className="irx-card" style={{ padding: '20px' }}>
        <div className="irx-section-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontWeight: 600, margin: 0 }}>Proposals ({proposals.length})</h2>
          <Button size="sm" onClick={() => setEditing({ lead: null })} className="gap-1">
            <Plus className="h-4 w-4" /> New Proposal
          </Button>
        </div>
        <div className="irx-list" style={{ marginTop: '12px' }}>
          {loading && <p style={{ fontSize: '13px', color: 'var(--text-secondary, #66736e)' }}>Loading…</p>}
          {!loading && proposals.length === 0 && (
            <div className="irx-empty">
              <p>No proposals yet. Build one from a quote request above — the client accepts online and a draft contract is created for you.</p>
            </div>
          )}
          {proposals.map((p) => (
            <div key={p.id} className="irx-card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '16px', background: 'var(--secondary-subtle, var(--secondary, rgba(0,0,0,0.03)))' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontWeight: 500, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.project_title}
                  </p>
                  <span className={STATUS_BADGE[p.status] || 'irx-badge'}>{p.status?.replaceAll('_', ' ')}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.proposal_number ? p.proposal_number + ' · ' : ''}{p.business_name || p.client_name || p.client_email} · {money(p.price_total)}
                  {p.valid_until ? ` · valid to ${p.valid_until}` : ''}
                </p>
              </div>
              {p.change_request && (
                <p style={{ fontSize: '13px', whiteSpace: 'pre-wrap', maxWidth: '24rem' }}>
                  Requested changes: {p.change_request}
                </p>
              )}
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                {p.status === 'accepted' && p.contract_id ? (
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <Link to={`/admin/contracts?contract=${encodeURIComponent(p.contract_id)}`}>Contract <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                ) : (
                  <>
                    <Button size="sm" onClick={() => setEditing({ proposal: p })}>
                      Review proposal
                    </Button>
                    <MoreActions>
                    {!['declined', 'expired'].includes(p.status) && (
                      <Button variant="outline" size="sm" onClick={() => handleSend(p)} className="gap-1">
                        <Send className="h-3.5 w-3.5" /> {p.access_token ? 'Resend' : 'Send'}
                      </Button>
                    )}
                    {p.access_token && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Copy link" onClick={() => copyLink(p)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete" onClick={() => handleDelete(p)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    </MoreActions>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-secondary, #66736e)' }}>
        Flow: quote request → proposal → client accepts online → draft contract created → send for signature → deposit invoice.
      </p>

      {/* Proposal edit/create dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.proposal ? 'Edit Proposal' : 'New Proposal'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <ProposalForm
              initial={editing.proposal || editing.lead || {}}
              settings={settings}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  );
}
