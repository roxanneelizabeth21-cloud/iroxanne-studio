import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  FolderKanban, FileText, Receipt, Mail, MessageSquare,
  CalendarDays, LayoutDashboard, Eye, Users, ScrollText
} from 'lucide-react';

export default function AdminOverview() {
  const { data: leads = [] } = useQuery({ queryKey: ['leads-admin'], queryFn: () => base44.entities.Lead.list('-created_date', 200) });
  const { data: contracts = [] } = useQuery({ queryKey: ['contracts-admin'], queryFn: () => base44.entities.Contract.list('-created_date', 200) });
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices-admin'], queryFn: () => base44.entities.Invoice.list('-created_date', 200) });
  const { data: subs = [] } = useQuery({ queryKey: ['subscribers-recent'], queryFn: () => base44.entities.Subscriber.list('-created_date', 50) });
  const { data: msgs = [] } = useQuery({ queryKey: ['contact-messages-recent'], queryFn: () => base44.entities.ContactMessage.list('-created_date', 50) });

  const activeLeads = leads.filter(l => !['lost', 'cancelled'].includes(l.status));
  const activeContracts = contracts.filter(c => !['cancelled', 'completed'].includes(c.status));
  const unpaidInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
  const unreadMsgs = msgs.filter(m => !m.read);

  const stats = [
    { to: '/admin/projects', count: activeLeads.length, label: 'Active leads', Icon: FolderKanban, accent: 'irx-accent-teal' },
    { to: '/admin/contracts', count: activeContracts.length, label: 'Open contracts', Icon: FileText, accent: 'irx-accent-violet' },
    { to: '/admin/invoices', count: unpaidInvoices.length, label: 'Unpaid invoices', Icon: Receipt, accent: 'irx-accent-gold' },
    { to: '/admin/messages', count: unreadMsgs.length, label: 'New messages', Icon: MessageSquare, accent: 'irx-accent-rose' },
  ];

  const quickLinks = [
    { to: '/admin/projects', label: 'Client Journey', desc: 'See each client’s stage and what happens next', Icon: FolderKanban },
    { to: '/admin/proposals', label: 'Quotes & Proposals', desc: 'Create and send client proposals', Icon: FileText },
    { to: '/admin/contracts', label: 'Contracts', desc: 'Manage agreements and signatures', Icon: ScrollText },
    { to: '/admin/invoices', label: 'Invoices', desc: 'Send invoices and track payments', Icon: Receipt },
    { to: '/admin/call-availability', label: 'Call Availability', desc: 'Set your booking calendar', Icon: CalendarDays },
    { to: '/admin/homepage', label: 'Homepage', desc: 'Edit your public homepage content', Icon: LayoutDashboard },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page header */}
      <div className="irx-page-header">
        <div className="irx-eyebrow">Business Manager</div>
        <h1>Business Home</h1>
        <p>Start with your client journey. Open a client to see their current stage and next action.</p>
      </div>

      <section className="irx-card">
        <h2 className="font-display text-2xl mb-2">What needs to move forward?</h2>
        <p className="text-sm text-muted-foreground mb-4">Follow each client from their first inquiry through payment and delivery. The journey shows what needs your attention and what is waiting on the client.</p>
        <Link to="/admin/projects" className="irx-pill active inline-flex items-center">Open Client Journey →</Link>
        <p className="text-sm text-muted-foreground mt-4">Inquiry → Proposal → Contract → Deposit → Intake → Build → Handoff → Paid</p>
      </section>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
        {stats.map(s => (
          <Link key={s.to} to={s.to} className="irx-stat">
            <div className={`irx-stat-icon ${s.accent}`}>
              <s.Icon style={{ width: 18, height: 18 }} />
            </div>
            <div className="irx-stat-number">{s.count}</div>
            <div className="irx-stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <div className="irx-section-head">
          <h2>Documents & tools</h2>
        </div>
        <div className="irx-actions-grid">
          {quickLinks.map(q => (
            <Link key={q.to} to={q.to} className="irx-action-tile">
              <q.Icon />
              <strong>{q.label}</strong>
              <small>{q.desc}</small>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity — two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Recent subscribers */}
        <div className="irx-card">
          <div className="irx-section-head" style={{ marginBottom: '8px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Mail style={{ width: 16, height: 16, color: '#3b7a6a' }} /> Recent Subscribers
            </h3>
            <Link to="/admin/subscribers">View all</Link>
          </div>
          {subs.length === 0 ? (
            <div className="irx-empty"><Users style={{ width: 32, height: 32 }} /><p>No subscribers yet.</p></div>
          ) : (
            <ul className="irx-list">
              {subs.slice(0, 5).map(s => (
                <li key={s.id}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</span>
                  <span className="irx-list-meta">{s.source_slug || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent messages */}
        <div className="irx-card">
          <div className="irx-section-head" style={{ marginBottom: '8px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <MessageSquare style={{ width: 16, height: 16, color: '#a77769' }} /> Recent Messages
            </h3>
            <Link to="/admin/messages">View all</Link>
          </div>
          {msgs.length === 0 ? (
            <div className="irx-empty"><MessageSquare style={{ width: 32, height: 32 }} /><p>No messages yet.</p></div>
          ) : (
            <ul className="irx-list">
              {msgs.slice(0, 5).map(m => (
                <li key={m.id}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject || m.name || 'Message'}</span>
                  <span className="irx-list-meta">{m.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
