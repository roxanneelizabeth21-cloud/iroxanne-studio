// The single media-resolution contract for a MarketingPost.
//
// Canonical fields, in explicit priority order:
//   1. media_file_url  — a direct upload / generated image URL
//   2. media_clip_id   — a ClipAsset reference (playable URL lives on ClipAsset.file)
//   3. clip_asset_id   — legacy template clip reference, read-only support
//   4. no media
//
// image_prompt is NEVER media. A ClipAsset id is never a playable URL.
// hasMedia is only true when a usable URL actually resolves.

export function mediaType(url) {
  if (!url) return null;
  return /\.(mp4|mov|m4v|webm|ogv|ogg|avi)(\?|#|$)/i.test(url) ? 'video' : 'image';
}

const NONE = {
  hasMedia: false, mediaType: null, type: null, url: null, thumbnailUrl: null,
  clipId: null, galleryImageId: null, source: null, error: null, clip: null,
};

function build(url, source, extra = {}) {
  const kind = mediaType(url);
  return {
    ...NONE,
    hasMedia: true,
    mediaType: kind,
    type: kind, // back-compat alias
    url,
    // ClipAssets have no stored thumbnail field, so videos use their own first
    // frame as the poster (rendered by a muted, metadata-preloaded <video>).
    thumbnailUrl: kind === 'image' ? url : null,
    source,
    ...extra,
  };
}

// Resolve the media attached to a post. `clips` and `galleryImages` are the
// already-loaded ClipAsset / GalleryImage lists.
export function getPostMedia(post, clips = [], galleryImages = []) {
  if (!post) return { ...NONE };

  const direct = String(post.media_file_url || '').trim();
  if (direct) {
    const gallery = galleryImages.find((g) => g.image_url === direct);
    return build(direct, 'upload', { galleryImageId: gallery ? gallery.id : null });
  }

  const clipId = post.media_clip_id || post.clip_asset_id || null;
  if (clipId) {
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) {
      return { ...NONE, clipId, source: post.media_clip_id ? 'clip' : 'legacy_clip', error: 'The referenced clip no longer exists.' };
    }
    const file = String(clip.file || '').trim();
    if (!file) {
      return { ...NONE, clipId, source: post.media_clip_id ? 'clip' : 'legacy_clip', error: 'That clip has no uploaded file.' };
    }
    return build(file, post.media_clip_id ? 'clip' : 'legacy_clip', { clipId, clip });
  }

  return { ...NONE };
}

// Does the post REFERENCE media (used for "media processing / broken" states)?
export function hasPostMedia(post) {
  return !!(post && (post.media_file_url || post.media_clip_id || post.clip_asset_id));
}

// The patch that attaches a ClipAsset — canonical field only, no competing values.
export function clipAttachPatch(clip) {
  return { media_clip_id: clip.id, media_file_url: '', clip_asset_id: '' };
}

// The patch that attaches a direct URL (upload, generated image, Gallery image).
export function urlAttachPatch(url) {
  return { media_file_url: url, media_clip_id: '', clip_asset_id: '' };
}

export const REMOVE_MEDIA_PATCH = { media_file_url: '', media_clip_id: '', clip_asset_id: '' };