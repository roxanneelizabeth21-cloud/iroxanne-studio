import ContactMessagesAdmin from '@/components/admin/ContactMessagesAdmin';

export default function MessagesAdminPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="irx-page-header">
        <div className="irx-eyebrow">Business Manager</div>
        <h1>Messages</h1>
        <p>View and respond to contact form submissions.</p>
      </div>
      <div className="irx-card">
        <ContactMessagesAdmin />
      </div>
    </div>
  );
}