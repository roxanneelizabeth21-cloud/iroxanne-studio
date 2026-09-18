import { ShoppingBag, Calendar, HeartHandshake, Lightbulb, ListChecks, Sparkles } from 'lucide-react';

const POSSIBILITIES = [
  {icon:ShoppingBag,title:'I want to sell something.',description:'A shop for products, custom orders, digital downloads, or pre-orders.'},
  {icon:Calendar,title:'I want people to book my services.',description:'A place to explore your offerings, request a quote, choose a time, and pay.'},
  {icon:HeartHandshake,title:'I want to organize my nonprofit or community.',description:'Bring volunteer sign-ups, events, member information, and requests together.'},
  {icon:Lightbulb,title:'I want to help people with something.',description:'Turn your knowledge or idea into a planning tool, resource library, or guided experience.'},
  {icon:ListChecks,title:'I need an easier way to run things.',description:'Keep projects, customer updates, forms, and everyday tasks in one place.'},
  {icon:Sparkles,title:'My idea doesn’t fit any of these.',description:'That’s welcome too. Tell me who you want to help and what you imagine.'},
];

export default function Services(){
  return <section id="services" className="scroll-mt-24 max-w-6xl mx-auto px-5 md:px-8 py-8">
    <p className="text-sm text-[#876b26] dark:text-[#D5BB82]">Let’s start with you</p>
    <h2 className="font-display text-3xl md:text-4xl mt-3 max-w-3xl">What’s your “I wish there were an app for…”?</h2>
    <p className="mt-5 max-w-3xl text-muted-foreground leading-relaxed">Maybe you’re starting a business, bringing people together, supporting a cause, or trying to make everyday tasks easier. You don’t need to know what to call it—or exactly how it should work. That’s something we can figure out together.</p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5 mt-6">
      {POSSIBILITIES.map(({icon:Icon,title,description})=><div key={title} className="border-t border-border pt-5">
        <Icon aria-hidden="true" className="h-5 w-5 text-[#876b26] dark:text-[#D5BB82]"/>
        <h3 className="font-display text-2xl mt-3">{title}</h3>
        <p className="mt-2 text-muted-foreground leading-relaxed text-sm">{description}</p>
      </div>)}
    </div>
    <a href="/quote" className="inline-flex min-h-12 items-center rounded-full bg-[#2D2A4A] text-white px-7 mt-6 font-semibold">Tell me what you’re imagining →</a>
    <p className="mt-3 text-sm text-muted-foreground">Already building it yourself? <a href="/quote?support=guidance" className="underline underline-offset-4">Ask about guidance.</a></p>
  </section>;
}