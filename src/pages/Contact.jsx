import { motion } from 'framer-motion';
import { Mail, MessageCircle } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import SocialLinks from '@/components/SocialLinks';
import PageBanner from '@/components/PageBanner';

export default function Contact() {
  return (
    <div className="min-h-screen">
      <PageBanner pageKey="contact" icon={MessageCircle} badge="Get in Touch" title="Contact" subtitle="Have a question, collaboration idea, or just want to say hey? Reach out." />

      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-6 md:p-8">
              <ContactForm />
            </div>
          </div>
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <Mail className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-sm text-muted-foreground">info@roxy-blue.com</p>
            </div>
            <div className="glass rounded-2xl p-6">
              <MessageCircle className="h-5 w-5 text-primary mb-3" />
              <h3 className="font-semibold mb-3">Connect</h3>
              <SocialLinks />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}