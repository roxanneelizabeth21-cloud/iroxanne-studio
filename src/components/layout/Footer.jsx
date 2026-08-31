import SocialLinks from '@/components/SocialLinks';
import BrandLogo from '@/components/BrandLogo';

export default function Footer() {
  return (
    <footer className="border-t border-border/30 bg-card/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
          <div>
           <BrandLogo className="h-16 w-16 mb-3" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Music for the soul. Stories from the heart.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Connect</h4>
            <SocialLinks />
          </div>
        </div>
        <div className="border-t border-border/30 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Roxsan Music. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Crafted with soul ✦
          </p>
        </div>
      </div>
    </footer>
  );
}