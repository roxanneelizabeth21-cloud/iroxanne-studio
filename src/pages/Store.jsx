import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageBanner from '@/components/PageBanner';

function ProductCard({ product }) {
  const statusBadge = {
    available: { label: 'Available', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
    coming_soon: { label: 'Coming Soon', className: 'bg-primary/10 text-primary border-primary/20' },
    sold_out: { label: 'Sold Out', className: 'bg-muted text-muted-foreground border-border' },
  };
  const badge = statusBadge[product.status] || statusBadge.coming_soon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group glass rounded-2xl overflow-hidden glass-hover"
    >
      <div className="aspect-square relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Package className="h-12 w-12 text-primary/30" />
          </div>
        )}
        <Badge className={`absolute top-3 left-3 ${badge.className} border text-[10px] uppercase tracking-wider`}>
          {badge.label}
        </Badge>
        <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="p-5">
        <h3 className="font-semibold mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-primary">
            {product.price ? `$${product.price.toFixed(2)}` : 'TBD'}
          </span>
          <Button
            size="sm"
            variant={product.status === 'available' ? 'default' : 'outline'}
            disabled={product.status === 'sold_out'}
            className="text-xs"
          >
            {product.status === 'available' ? 'Add to Cart' : product.status === 'sold_out' ? 'Sold Out' : 'Notify Me'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Store() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.MerchProduct.list('-created_date'),
  });

  return (
    <div className="min-h-screen">
      <PageBanner pageKey="store" icon={ShoppingBag} badge="Official Merch" title="Store" subtitle="Wear the brand. Carry the vibe." />

      <div className="max-w-6xl mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">Merch is coming soon!</p>
            <p className="text-sm text-muted-foreground">Check back for exclusive Roxsan merchandise.</p>
          </div>
        )}
      </div>
    </div>
  );
}