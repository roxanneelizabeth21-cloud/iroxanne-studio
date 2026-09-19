import { Check, Plus, ArrowRight } from 'lucide-react';

const included = [
 ['Up to four pages', 'Home, About, Services, and Contact.'],
 ['Your branding and content', 'Your existing logo, colors, photos, and business information arranged into a cohesive design.'],
 ['Mobile-friendly layouts', 'Designed for phones, tablets, and computers.'],
 ['Service-request form', 'Collect inquiries from prospective customers.'],
 ['Owner dashboard', 'View inquiries, add notes, and mark requests new, contacted, or completed.'],
 ['Call scheduling', 'One owner, one calendar, and one appointment type through a supported scheduling connection.'],
 ['Social profile links', 'Help visitors find your existing social accounts.'],
 ['One revision round', 'One consolidated set of changes within the agreed scope.'],
 ['Launch and handoff', 'Domain connection, testing of included features, and a walkthrough of how to manage your website.'],
];

const groups = [
 {title:'Customers & Services', intro:'Organize inquiries, appointments, and customer relationships.', items:[
 ['Customer records','Keep contact details, notes, and inquiry history organized.'],
 ['Detailed intake forms','Collect the information you need before quoting or starting a job.'],
 ['In-app appointment scheduling','Manage service availability and bookings inside your application.'],
 ['Calendar connections','Connect supported external calendars to your scheduling workflow.'],
 ['Client portals','Give customers private access to their project information and purchased services.'],
 ['Job tracking','Organize work by stage, date, and customer.']]},
 {title:'Quotes, Agreements & Payments',intro:'Move from customer interest to agreed work and payment.',items:[
 ['Quotes and proposals','Prepare itemized offers and track customer responses.'],
 ['Agreement workflows','Send your agreement templates through a supported signing service.'],
 ['Invoicing','Create invoices and track outstanding balances.'],
 ['Online payments and deposits','Connect a payment provider so customers can pay online.'],
 ['Automated payment updates','Update payment records when supported payment events occur.']]},
 {title:'Retail & Digital Products',intro:'Sell products and manage the work behind each order.',items:[
 ['Online stores','Display products, accept orders, and manage sales.'],
 ['Inventory management','Track stock quantities, adjustments, and low-stock items.'],
 ['Custom orders and preorders','Collect specialized requests and manage orders before fulfillment.'],
 ['Supplier and purchasing tools','Organize suppliers, purchase orders, and receiving.'],
 ['Digital product sales','Sell downloads, guides, studies, and other digital resources.'],
 ['Memberships and subscriptions','Offer paid access to selected content or services.']]},
 {title:'Marketing & Communication',intro:'Build your audience and organize your communication.',items:[
 ['Newsletter signup and subscriber management','Build and organize your email audience.'],
 ['Newsletter setup','Create branded templates and scheduled email campaigns.'],
 ['Automated follow-up emails','Send agreed messages in response to customer actions.'],
 ['Social media publishing tools','Connect supported profiles and organize approvals, scheduling, and publishing.'],
 ['AI-assisted content tools','Generate drafts for review using an agreed content workflow.'],
 ['Promotions','Add selected discounts, offers, or affiliate features.']],
 note:'Marketing-system setup does not include ongoing content creation, campaign management, or advertising spend unless included in your proposal.'},
 {title:'Business Operations & Reporting',intro:'Bring everyday work and useful information together.',items:[
 ['Income and expense tracking','Organize financial records and prepare exports.'],
 ['Business dashboards','View agreed activity, sales, or operational reports.'],
 ['Staff access','Give team members access appropriate to their roles.'],
 ['Event registration and ticketing','Manage registrations, tickets, and check-in.'],
 ['Nonprofit tools','Support donations, volunteer registration, and event participation.'],
 ['Workflow automation','Connect steps across your business systems to reduce repetitive work.']],
 note:'Financial tracking does not include tax preparation or filing.'},
 {title:'Installable Web Application — PWA',intro:'Let customers open your web application from their home screen.',items:[
 ['PWA installation support','Add installation support, app icon, and launch presentation on agreed supported devices.'],
 ['Additional capabilities','Offline functionality and push notifications are separately scoped.']],
 note:'PWA setup does not include native mobile development or app-store distribution.'},
];

const buttonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2D2A4A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3D3A5A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#876b26]';

export default function Pricing() {
 return <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-24 border-y border-border bg-card px-5 py-10 md:px-8">
  <div className="mx-auto max-w-6xl">
   <p className="text-sm font-medium text-[#876b26] dark:text-[#D5BB82]">Services & Pricing</p>
   <h2 id="pricing-heading" className="font-display mt-2 max-w-3xl text-3xl md:text-5xl">A website for your business.<br className="hidden sm:block" /> Room to grow.</h2>
   <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">Start with a complete business website. Add tools for managing customers, selling products, organizing your work, or marketing your business when you need them.</p>
   <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-background">
    <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
     <div className="border-b border-border bg-[#2D2A4A] text-white p-6 md:p-8 lg:border-b-0 lg:border-r [&_.text-muted-foreground]:text-white/80">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your starting point</p>
      <h3 className="font-display mt-3 text-3xl">Business Website</h3>
      <p className="mt-4 text-5xl font-semibold tracking-tight">$650</p>
      <p className="mt-2 text-sm text-muted-foreground">One-time website build</p>
      <p className="mt-5 leading-relaxed text-muted-foreground">A finished website that introduces your business and gives customers a way to inquire or schedule a call.</p>
      <a href="/quote" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2D2A4A] hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Start My Website <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">You provide your logo, photos, and business content. Domain registration, platform subscriptions, business email, and other third-party charges are separate and discussed before work begins.</p>
     </div>
     <div className="p-6 md:p-8">
      <h4 className="text-lg font-semibold">Your package includes</h4>
      <ul className="mt-5 space-y-4">
       {included.map(([title,description])=><li key={title} className="flex gap-3"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#876b26] dark:text-[#D5BB82]" /><div><span className="font-semibold">{title}</span><p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{description}</p></div></li>)}
      </ul>
     </div>
    </div>
   </div>
   <div id="addons" className="mt-10 scroll-mt-24">
    <h3 className="font-display text-3xl md:text-4xl">What do you want your website to do for you?</h3>
    <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">Your website can do more than introduce your business. Choose additional tools that support the way you work.</p>
    <div className="mt-5 rounded-xl border border-[#2D2A4A] bg-[#2D2A4A] text-white px-5 py-4 [&_.text-muted-foreground]:text-white/80">
     <p className="font-semibold">Optional Add-ons — Priced Separately</p>
     <p className="mt-1 text-sm leading-relaxed text-muted-foreground">These services are not included in the $650 package. Each addition is quoted around your requirements. You’ll receive a written scope and price before work begins.</p>
    </div>
    <div className="mt-5 grid items-start gap-3 md:grid-cols-2">
     {groups.map(group=><details key={group.title} className="group rounded-xl border border-border bg-background">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-xl p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#876b26] [&::-webkit-details-marker]:hidden">
       <span><span className="block text-lg font-semibold">{group.title}</span><span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{group.intro}</span></span>
       <Plus aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 transition-transform group-open:rotate-45" />
      </summary>
      <ul className="space-y-4 border-t border-border px-5 py-5">{group.items.map(([title,description])=><li key={title}><h4 className="text-sm font-semibold">{title}</h4><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></li>)}</ul>
      {group.note && <p className="px-5 pb-5 text-xs leading-relaxed text-muted-foreground">{group.note}</p>}
     </details>)}
    </div>
    <a href="/quote" className={buttonClass + ' mt-5'}>Explore My Add-ons <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
   </div>
   <div className="mt-8 grid gap-5 md:grid-cols-2">
    <div className="rounded-xl border border-border p-6">
     <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Have an application idea?</p>
     <h3 className="font-display mt-3 text-2xl">Custom Web & Mobile Applications</h3>
     <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Need something beyond a business website? We can discuss a customer platform, event system, specialized business application, or mobile product.</p>
     <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Your proposal will define the features, user roles, integrations, testing, and launch requirements. Mobile development and app-store delivery receive their own scope and quote.</p>
     <a href="/quote" className="mt-4 inline-flex min-h-12 items-center font-semibold underline underline-offset-4">Discuss My Application →</a>
    </div>
    <div className="rounded-xl border border-border p-6">
     <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Support as you grow</p>
     <h3 className="font-display mt-3 text-2xl">Ongoing Support</h3>
     <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Optional ongoing support is available for updates and agreed improvements. Your proposal will explain what’s included, the support allowance, and any recurring charges.</p>
     <a href="/quote" className="mt-4 inline-flex min-h-12 items-center font-semibold underline underline-offset-4">Ask About Support →</a>
    </div>
   </div>
   <div className="mt-8 border-t border-border pt-6">
    <h3 className="font-display text-3xl">Let’s start with what you need.</h3>
    <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">Tell me about your business, what you want customers to be able to do, and the tasks you’d like help managing. We’ll decide what belongs in your first build and what can come later.</p>
    <a href="/quote" className={buttonClass + ' mt-5'}>Request a Quote <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
    <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted-foreground">Additional features are optional and priced separately. Shared setup is counted once in combined quotes. Platform subscriptions, domains, processing fees, and other third-party costs are disclosed before work begins.</p>
   </div>
  </div>
 </section>;
}
