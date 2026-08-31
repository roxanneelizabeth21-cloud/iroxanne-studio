import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Camera, ImageIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GalleryGrid from '@/components/GalleryGrid';
import PageBanner from '@/components/PageBanner';

export default function Gallery() {
  const [filter, setFilter] = useState('all');

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => base44.entities.GalleryImage.list('-created_date'),
  });

  const filtered = filter === 'all' ? images : images.filter((img) => img.category === filter);

  return (
    <div className="min-h-screen">
      <PageBanner pageKey="gallery" icon={Camera} badge="Visual World" title="Gallery" subtitle="Moments captured. Stories told through images." />

      <div className="max-w-6xl mx-auto px-4 pb-20 space-y-8">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="promo">Promo</TabsTrigger>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="behind_the_scenes">BTS</TabsTrigger>
            <TabsTrigger value="press">Press</TabsTrigger>
            <TabsTrigger value="personal">Personal</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <GalleryGrid images={filtered} />
        ) : (
          <div className="text-center py-20">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No images in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}