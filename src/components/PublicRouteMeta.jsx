import { useLocation } from 'react-router-dom';
import DocumentMeta from '@/components/DocumentMeta';
import { PAGE_META, DEFAULT_SHARE_IMAGE, SITE_NAME, canonicalUrl } from '@/lib/siteMeta';

// Applies the default share metadata for each public route. Mounted before the
// routed page so any page that sets its own richer meta (a release page) still
// wins. Renders nothing.
export default function PublicRouteMeta() {
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] || PAGE_META['/'];

  return (
    <DocumentMeta
      title={meta.title}
      description={meta.description}
      image={meta.image || DEFAULT_SHARE_IMAGE}
      url={canonicalUrl(pathname)}
      type={meta.type || 'website'}
      siteName={SITE_NAME}
      imageAlt={meta.title}
    />
  );
}