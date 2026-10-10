import { Home, Scissors, PawPrint, PartyPopper, HeartPulse, GraduationCap, ShoppingBag, Users } from 'lucide-react';

const GROUPS = [
  {icon:Home,title:'Home services',examples:'Landscapers, house cleaners, handymen, painters, pressure washers, pool cleaners, movers',need:'Online quote requests, job scheduling, and repeat-customer records.'},
  {icon:Scissors,title:'Beauty and personal care',examples:'Hair stylists, barbers, nail techs, lash and brow artists, braiders, estheticians, massage therapists',need:'Online booking, client intake, and reminders, so clients stop booking through your messages.'},
  {icon:PawPrint,title:'Pet care',examples:'Pet sitters, dog walkers, groomers, dog trainers',need:'Booking requests, pet profiles, visit notes, and easy repeat bookings.'},
  {icon:PartyPopper,title:'Events and creative',examples:'Event planners, photographers, DJs, caterers, florists, bakers, party rentals',need:'Inquiry and quote forms, client intake, timelines, and vendor details in one place.'},
  {icon:HeartPulse,title:'Health and wellness',examples:'Personal trainers, fitness studios, wellness coaches, doulas',need:'Class and session booking, client check-ins, and packages.'},
  {icon:GraduationCap,title:'Professional and education',examples:'Tutors, music teachers, coaches, consultants, notaries',need:'Scheduling, intake forms, client portals, and organized records.'},
  {icon:ShoppingBag,title:'Product brands and shops',examples:'Boutiques, custom product makers, bakers, artists, online sellers',need:'Online ordering, custom request forms, pre-orders, and inventory.'},
  {icon:Users,title:'Creators, ministries and community groups',examples:'Content creators, churches, nonprofits, clubs, pageants',need:'Memberships, events, sign-ups, donations, and a home for your content.'},
];

export default function WhoIBuildFor(){
  return <section id="who-i-build-for" aria-labelledby="who-heading" className="scroll-mt-24 max-w-6xl mx-auto px-5 md:px-8 py-8">
    <p className="text-sm text-[#876b26] dark:text-[#D5BB82]">Who I work with</p>
    <h2 id="who-heading" className="font-display text-3xl md:text-4xl mt-3 max-w-3xl">Built for businesses like yours.</h2>
    <p className="mt-5 max-w-3xl text-muted-foreground leading-relaxed">Whether you take bookings, sell products, run events, or are starting with an idea, I can replace the spreadsheets, paper forms, and back-and-forth messages with a website or app built around how you work. These are just examples.</p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5 mt-6">
      {GROUPS.map(({icon:Icon,title,examples,need})=><div key={title} className="border-t border-border pt-5">
        <Icon aria-hidden="true" className="h-5 w-5 text-[#876b26] dark:text-[#D5BB82]"/>
        <h3 className="font-display text-2xl mt-3">{title}</h3>
        <p className="mt-2 text-sm font-medium">{examples}</p>
        <p className="mt-2 text-muted-foreground leading-relaxed text-sm">{need}</p>
      </div>)}
    </div>
    <p className="mt-5 text-sm text-muted-foreground">Don’t see your business here? You’re still welcome. <a href="/quote" className="underline underline-offset-4">Tell me what you do.</a></p>
  </section>;
}
