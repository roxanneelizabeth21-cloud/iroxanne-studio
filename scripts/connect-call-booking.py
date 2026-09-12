import json
from pathlib import Path
p=Path('base44/entities/Lead.jsonc');d=json.loads(p.read_text())
d['properties'].update({k:{'type':'string'} for k in ['booking_token','call_event_id','call_start','call_end','call_pending_start']})
p.write_text(json.dumps(d,indent=2)+'\n')
def edit(path,a,b):
 p=Path(path);t=p.read_text();assert t.count(a)==1,(path,a[:70],t.count(a));p.write_text(t.replace(a,b))
edit('src/App.jsx',"import GetQuote from '@/pages/GetQuote';","import GetQuote from '@/pages/GetQuote';\nimport BookCall from '@/pages/BookCall';\nimport CallAvailabilityPage from '@/pages/admin/CallAvailabilityPage';")
edit('src/App.jsx','<Route path="/quote" element={<GetQuote />} />','<Route path="/quote" element={<GetQuote />} />\n      <Route path="/book-call" element={<BookCall />} />')
edit('src/App.jsx','<Route path="/admin/proposals" element={<ProposalsAdminPage />} />','<Route path="/admin/proposals" element={<ProposalsAdminPage />} />\n        <Route path="/admin/call-availability" element={<CallAvailabilityPage />} />')
edit('src/components/admin/AdminLayout.jsx',"{ to: '/admin/proposals', label: 'Quotes & Proposals', Icon: FileText },","{ to: '/admin/proposals', label: 'Quotes & Proposals', Icon: FileText },\n  { to: '/admin/call-availability', label: 'Call availability', Icon: CalendarDays },")
p='src/pages/GetQuote.jsx'
edit(p,'  const [submitted, setSubmitted] = useState(false);',"  const [submitted, setSubmitted] = useState(false);\n  const [bookingLink,setBookingLink] = useState('');\n  const [bookingEnabled,setBookingEnabled] = useState(false);")
edit(p,"  React.useEffect(() => {\n    base44.entities.PricingSettings.list()","  React.useEffect(() => {\n    base44.functions.invoke('quoteCallBooking',{action:'config'}).then(r=>setBookingEnabled(!!(r.data||r).enabled)).catch(()=>{});\n    base44.entities.PricingSettings.list()")
edit(p,"      await base44.entities.Lead.create({","      const bookingToken=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');\n      const lead=await base44.entities.Lead.create({\n        booking_token:bookingToken,")
edit(p,"      setSubmitted(true);","      setBookingLink('/book-call?lead='+encodeURIComponent(lead.id)+'&t='+bookingToken);\n      setSubmitted(true);")
edit(p,"with a custom proposal.</p></div></div>);",'with a custom proposal.</p>{bookingEnabled && <div className="mt-6 pt-6 border-t border-black/10"><p className="text-sm text-gray-600 mb-3">Want to talk through your project? Choose an available time for an optional call.</p><Button asChild className="rounded-full"><a href={bookingLink}>Schedule an optional call</a></Button><p className="text-xs text-gray-500 mt-3">You can also use the booking link in your confirmation email.</p></div>}</div></div>);')
p='base44/functions/sendLeadNotification/entry.ts'
edit(p,'    // 2) Client welcome',"""    const callSettings=await base44.asServiceRole.entities.CallSettings.list('-updated_date',1).catch(()=>[]);
    const bookingLink=callSettings[0]?.enabled && lead.booking_token ? 'https://iroxannestudio.base44.app/book-call?lead='+encodeURIComponent(lead.id)+'&t='+encodeURIComponent(lead.booking_token) : '';
    // 2) Client welcome""")
edit(p,"            <p style=\"margin:22px 0 0;\">${brandButton('See my work', 'https://iroxannestudio.com')}</p>","""            ${bookingLink ? '<p style="margin:20px 0 8px;">If a conversation would help, choose an available time for an optional call.</p><p>'+brandButton('Schedule an optional call',bookingLink)+'</p>' : ''}
            <p style="margin:22px 0 0;">${brandButton('See my work', 'https://iroxannestudio.com')}</p>""")
print('Quote booking routes, confirmation button, email link and admin settings connected.')
