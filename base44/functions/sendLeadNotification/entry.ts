import { requireAuthenticated } from '../../shared/marketingAdmin.ts';
import { sendStudioEmail } from '../../shared/studioEmail.ts';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { esc, resolveAdminEmail, brandedEmail, brandButton, detailRows } from '../../shared/emailBrand.ts';
import { studioUrl, adminLink } from '../../shared/studioUrl.ts';

// Fired immediately when a new Lead is created.
// 1) Notifies the studio admin with the lead's details.
// 2) Sends a warm welcome email to the client.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard=await requireAuthenticated(base44);
    if(!guard.ok)return guard.response;
    const body = await req.json().catch(() => ({}));
    const leadId = body.lead_id || body.id || body.entity_id;
    if (!leadId) return Response.json({ error: 'Missing lead_id' }, { status: 400 });

    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

    if(lead.is_test_record)return Response.json({skipped:true,reason:'test record'});
    const deliveryErrors=[];
    const adminEmail = await resolveAdminEmail(base44).catch(() => '');
    const BUDGET_LABELS = { under_1500:'Under $1,500','1500_3000':'$1,500–$3,000','3000_5000':'$3,000–$5,000','5000_8000':'$5,000–$8,000','8000_plus':'$8,000+',not_sure:'Not sure yet' };
    const budgetLabel = (v) => BUDGET_LABELS[v] || v || '';

    // 1) Admin notification
    if (adminEmail && !lead.quote_admin_email_state) {
      await base44.asServiceRole.entities.Lead.update(lead.id,{quote_admin_email_state:'sending'});
      const rows: [string, string][] = [
        ['Name', lead.name || ''],
        ['Email', lead.email || ''],
        ['Business', lead.business_name || ''],
        ['Budget', budgetLabel(lead.budget_range)],
        ['Estimated', lead.draft_estimate_status ? 'Notes-based draft: review scope and pricing in Quotes & Proposals.' : ['Quick Win','Starter','Business Website'].includes(lead.selected_package) ? `${lead.selected_package} website ($${lead.estimated_price_low ?? ''}); requested add-ons require a quote` : lead.estimated_price_low != null ? `$${lead.estimated_price_low}–$${lead.estimated_price_high} (${lead.estimated_tier || ''})` : ''],
        ['Pitch', lead.quick_pitch || ''],
      ].filter(([, v]) => v);
      await sendStudioEmail(base44,{
        to: adminEmail,
        subject: `New quote request: ${lead.name || lead.email}`,
        body: brandedEmail({
          title: 'New quote request',
          content: `<p style="margin:0 0 16px;">A new project inquiry just came in.</p>${detailRows(rows)}<p style="margin:18px 0 0;">${brandButton('Review in dashboard', adminLink(req, 'proposals')+'?lead='+encodeURIComponent(lead.id))}</p>`,
          footerNote: 'iRoxanne Studio, one builder, not an agency.',
        }),
      }).then(()=>base44.asServiceRole.entities.Lead.update(lead.id,{quote_admin_email_state:'sent'})).catch(async(e) => { deliveryErrors.push('Admin notification: '+e.message); await base44.asServiceRole.entities.Lead.update(lead.id,{quote_admin_email_state:'error'}); });
    }

    const callSettings=await base44.asServiceRole.entities.CallSettings.list('-updated_date',1).catch(()=>[]);
    const bookingLink=callSettings[0]?.enabled && lead.booking_token ? studioUrl(req)+'/book-call?lead='+encodeURIComponent(lead.id)+'&t='+encodeURIComponent(lead.booking_token) : '';
    // 2) Client welcome: single rich confirmation reflecting what they submitted.
    if (lead.email && !lead.quote_confirmation_email_state) {
      await base44.asServiceRole.entities.Lead.update(lead.id,{quote_confirmation_email_state:'sending'});
      const firstName = (lead.name || '').split(' ')[0] || 'there';
      const summary: [string, string][] = [
        ['Business', lead.business_name || ''],
        ['Requested help', lead.selected_package === 'Not sure' ? 'Help shaping your idea' : ['Quick Win','Starter','Business Website'].includes(lead.selected_package) ? 'Website' : lead.selected_package || ''],
        ['Ideal launch', lead.ideal_launch_date || ''],
      ].filter(([, v]) => v);
      await sendStudioEmail(base44,{
        to: lead.email,
        subject: "We've got your project details — iRoxanne Studio",
        body: brandedEmail({
          title: `Thanks, ${esc(firstName)}!`,
          content: `<p style="margin:0 0 16px;">I've received your quote request and I'll review your details personally. Expect a reply within 2 business days with a proposal or any questions needed to prepare it.</p>
            ${summary.length ? `<p style="margin:0 0 8px;font-size:13px;font-weight:600;">Your request:</p>${detailRows(summary)}` : ''}
            ${bookingLink ? '<p style="margin:20px 0 8px;">If a conversation would help, choose an available time for an optional call.</p><p>'+brandButton('Schedule an optional call',bookingLink)+'</p>' : ''}
            <p style="margin:20px 0 0;"><a href="https://media.base44.com/videos/public/6a94dbc673f0d144b6ed36bb/24c961373_QuoteReceivedWelcome_720p.mp4">Watch a short welcome from Roxanne</a></p><p>You do not need to fill in another form. Reply to this email if you want to add anything.</p>
            <p style="margin:24px 0 0;font-size:13px;">— Roxanne, iRoxanne Studio</p>`,
          footerNote: 'iRoxanne Studio, one builder, not an agency.',
        }),
      }).then(()=>base44.asServiceRole.entities.Lead.update(lead.id,{quote_confirmation_email_state:'sent'})).catch(async(e) => { deliveryErrors.push('Client confirmation: '+e.message); await base44.asServiceRole.entities.Lead.update(lead.id,{quote_confirmation_email_state:'error'}); });
    }

    return Response.json({success:deliveryErrors.length===0,errors:deliveryErrors});
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}