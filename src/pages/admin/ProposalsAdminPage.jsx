import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Plus, Send, Copy, Pencil, ChevronDown, ChevronRight, ArrowRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProposalForm from '@/components/admin/ProposalForm';
import { useConfirmDelete } from '@/components/admin/ConfirmDeleteDialog';
import { deleteProjectChain, chainSummary } from '@/lib/projectChain';

const money = (n) => (typeof n === 'number' ? `$${n.toLocaleString()}` : '—');

const STATUS_STYLES = {
  changes_requested: 'bg-amber-500/10 text-amber-700',
  draft: 'bg-secondary text-muted-foreground',
  sent: 'bg-blue-500/10 text-blue-600',
  viewed: 'bg-amber-500/10 text-amber-700',
  accepted: 'bg-green-500/10 text-green-600',
  declined: 'bg-destructive/10 text-destructive',
  expired: 'bg-secondary text-muted-foreground',
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

  const load = async () => {
    setLoading(true);
    try {
      const [leadList, proposalList, settingsList] = await Promise.all([
        base44.entities.Lead.filter({ status: 'new' }).catch(() => []),
        base44.entities.Proposal.list('-created_date', 50).catch(() => []),
        base44.entities.PricingSettings.list().catch(() => []),
      ]);
      setLeads(leadList);
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
    navigator.clipboard.writeText(`${window.location.origin}/proposal/${p.id}?t=${p.access_token}`);
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
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" /> Proposals
      </h1>

      {/* New quote requests */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <button onClick={() => setShowLeads((v) => !v)} className="flex items-center gap-2 w-full">
          {showLeads ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <h2 className="font-semibold">New Quote Requests ({leads.length})</h2>
        </button>
        {showLeads && (
          <div className="space-y-2">
            {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!loading && leads.length === 0 && <p className="text-sm text-muted-foreground">No new quote requests.</p>}
            {leads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/40 p-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{lead.name || lead.email}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lead.business_name ? `${lead.business_name} · ` : ''}{lead.quick_pitch?.slice(0, 80) || 'No pitch'}
                  </p>
                  {lead.estimated_price_low != null && (
                    <p className="text-xs text-primary mt-0.5">
                      Est. {money(lead.estimated_price_low)}–{money(lead.estimated_price_high)}
                      {lead.estimated_tier ? ` · ${lead.estimated_tier}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" onClick={() => setEditing({ lead })} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Build Proposal
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
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Proposals ({proposals.length})</h2>
          <Button size="sm" onClick={() => setEditing({ lead: null })} className="gap-1">
            <Plus className="h-4 w-4" /> New Proposal
          </Button>
        </div>
        <div className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && proposals.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No proposals yet. Build one from a quote request above — the client accepts online and a draft contract is created for you.
            </p>
          )}
          {proposals.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/40 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{p.project_title}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] || ''}`}>{p.status}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {p.proposal_number ? p.proposal_number + ' · ' : ''}{p.business_name || p.client_name || p.client_email} · {money(p.price_total)}
                  {p.valid_until ? ` · valid to ${p.valid_until}` : ''}
                </p>
              </div>
              {p.change_request && <p className="text-sm whitespace-pre-wrap max-w-sm">Requested changes: {p.change_request}</p>}
              <div className="flex gap-1 shrink-0 items-center">
                {p.status === 'accepted' && p.contract_id ? (
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <Link to="/admin/contracts">Contract <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({ proposal: p })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
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
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Flow: quote request → proposal → client accepts online → draft contract created → send for signature → deposit invoice.
      </p>

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