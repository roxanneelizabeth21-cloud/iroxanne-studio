import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import PImage from 'npm:pureimage@0.4.13';
import jpeg from 'npm:jpeg-js@0.4.4';
import { PNG } from 'npm:pngjs@7.0.0';
import { Buffer } from 'node:buffer';

// pureimage detects a browser via `window` (which Deno exposes) then accesses
// `document` (which Deno lacks). Stub a document whose createElement returns a
// non-functional canvas so pureimage's make() falls back to its pure-JS Bitmap.
(globalThis as any).document = (globalThis as any).document || {
  createElement: () => ({ getContext: () => null, width: 0, height: 0, style: {} }),
  fonts: { load: async () => {}, check: async () => true, ready: Promise.resolve() },
};
const PImageKeys = Object.keys(PImage as any);
const BitmapCtor: any = (PImage as any).Bitmap;

// composeMarketingGraphic — non-generative image composition.
// Takes an EXISTING image URL, composes it with exact marketing text
// (headline, supporting line, signature), renders a finished PNG at the
// requested aspect ratio, uploads it, saves a GalleryImage record, and
// attaches it to the identified draft post. No AI image generation, no
// approval, no scheduling, no publishing. Preserves the previous asset URL
// for recovery.

const SIZES: Record<string, { w: number; h: number }> = {
  '4:5': { w: 1080, h: 1350 },
  '1:1': { w: 1080, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1920, h: 1080 },
};

const FONT_SOURCES = [
  { family: 'StudioBold', url: 'https://cdn.jsdelivr.net/gh/google/fonts/ofl/lato/Lato-Bold.ttf' },
  { family: 'StudioRegular', url: 'https://cdn.jsdelivr.net/gh/google/fonts/ofl/lato/Lato-Regular.ttf' },
  { family: 'StudioBlack', url: 'https://cdn.jsdelivr.net/gh/google/fonts/ofl/lato/Lato-Black.ttf' },
];

let fontPromise: Promise<Set<string>> | null = null;

function loadFonts(): Promise<Set<string>> {
  if (fontPromise) return fontPromise;
  fontPromise = (async () => {
    const loaded = new Set<string>();
    for (const src of FONT_SOURCES) {
      try {
        const res = await fetch(src.url);
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        const f = PImage.registerFont(buf, src.family);
        await f.load();
        loaded.add(src.family);
      } catch {
        // skip — another registered family will be used
      }
    }
    return loaded;
  })();
  return fontPromise;
}

function pickFont(loaded: Set<string>, pref: string[]): string {
  for (const p of pref) if (loaded.has(p)) return p;
  return loaded.size ? Array.from(loaded)[0] : 'sans-serif';
}

function wrapText(ctx: any, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of String(text).split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    if (!words.length) lines.push('');
  }
  return lines;
}

async function decodeSourceImage(url: string): Promise<{ width: number; height: number; data: Uint8Array }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch source image (HTTP ${res.status}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 3) throw new Error('Source image is empty or unreadable.');
  // PNG magic
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    const png = PNG.sync.read(buf);
    return { width: png.width, height: png.height, data: new Uint8Array(png.data) };
  }
  // JPEG magic
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    const raw = jpeg.decode(buf, { useTArray: true });
    return { width: raw.width, height: raw.height, data: new Uint8Array(raw.data) };
  }
  throw new Error('Unsupported image format (only PNG and JPEG are supported).');
}

function bitmapFromRGBA(w: number, h: number, rgba: Uint8Array): any {
  const img = PImage.make(w, h);
  // pureimage bitmaps expose a .data Uint8Array (RGBA). Copy decoded pixels in.
  const dst = img.data as Uint8Array;
  if (dst.length >= rgba.length) dst.set(rgba);
  return img;
}

async function encodeCanvasToPNG(canvas: any): Promise<Uint8Array> {
  // Read raw RGBA straight off the bitmap, then encode with pngjs (no streams).
  const w = canvas.width;
  const h = canvas.height;
  const png = new PNG({ width: w, height: h });
  const src = canvas.data as Uint8Array;
  const dst = png.data as Uint8Array;
  dst.set(src);
  const encoded = PNG.sync.write(png);
  return new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.byteLength);
}

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));

    // DIAGNOSTIC — inspect pureimage exports to locate the Bitmap constructor
    if (body?.diag) {
      return Response.json({
        keys: PImageKeys,
        types: PImageKeys.map(k => `${k}: ${typeof (PImage as any)[k]}`),
        BitmapType: typeof BitmapCtor,
        hasMake: typeof (PImage as any).make,
        hasRegisterFont: typeof (PImage as any).registerFont,
        defaultExport: typeof PImage,
        defaultKeys: PImage && typeof PImage === 'object' ? Object.keys(PImage) : null,
      });
    }
    const {
      post_id, image_url, headline = '', supporting_line: supportingLine = '',
      signature = 'iRoxanne Studio', aspect_ratio: aspectRatio = '4:5',
      text_position: textPosition = 'bottom', text_color: textColor = 'white',
      campaign_id: campaignId, portfolio_item_id: portfolioItemId,
      original_request: originalRequest = '', visual_direction: visualDirection = {},
    } = body || {};

    if (!image_url || typeof image_url !== 'string') {
      return Response.json({ ok: false, error: 'image_url is required (an existing photo to compose with).' }, { status: 400 });
    }
    if (!headline && !supportingLine && !signature) {
      return Response.json({ ok: false, error: 'At least one of headline, supporting_line, or signature is required.' }, { status: 400 });
    }
    const ar = SIZES[aspectRatio] ? aspectRatio : '4:5';
    const { w: W, h: H } = SIZES[ar];

    // --- Load the post (preserve previous asset for recovery) ---
    let post: any = null;
    if (post_id) {
      post = await base44.entities.MarketingPost.get(post_id).catch(() => null);
      if (!post) return Response.json({ ok: false, error: 'Post not found.' }, { status: 404 });
      if (['Posted', 'Partially Published', 'Publishing'].includes(post.status) || post.publishing_status === 'Publishing') {
        return Response.json({ ok: false, error: 'Create a new draft to revise a published or publishing post.' }, { status: 409 });
      }
    }
    const previous_image_url = post?.media_file_url || '';

    // --- Fonts ---
    const loaded = await loadFonts();
    const boldFont = pickFont(loaded, ['StudioBlack', 'StudioBold']);
    const regularFont = pickFont(loaded, ['StudioRegular', 'StudioBold']);

    // --- Decode the source photo ---
    const src = await decodeSourceImage(image_url);
    const srcBitmap = bitmapFromRGBA(src.width, src.height, src.data);

    // --- Create the output canvas (pure-JS bitmap, no DOM) ---
    const canvas: any = PImage.make(W, H);
    const ctx = canvas.getContext('2d');

    // Fill with a dark base so any letterboxing is intentional, not white.
    ctx.fillStyle = '#15131a';
    ctx.fillRect(0, 0, W, H);

    // Cover-fit the source image into the target frame (crop overflow).
    const scale = Math.max(W / src.width, H / src.height);
    const dw = Math.round(src.width * scale);
    const dh = Math.round(src.height * scale);
    const dx = Math.round((W - dw) / 2);
    const dy = Math.round((H - dh) / 2);
    ctx.drawImage(srcBitmap, dx, dy, dw, dh);

    // --- Scrim for text legibility ---
    const ink = textColor === 'black' ? '255,255,255' : '0,0,0';
    const scrimH = Math.round(H * 0.62);
    const scrimTop = textPosition === 'bottom' ? H - scrimH : 0;
    const grad = ctx.createLinearGradient(0, scrimTop, 0, scrimTop + scrimH);
    if (textPosition === 'bottom') {
      grad.addColorStop(0, `rgba(${ink},0)`);
      grad.addColorStop(0.30, `rgba(${ink},0.45)`);
      grad.addColorStop(0.70, `rgba(${ink},0.78)`);
      grad.addColorStop(1, `rgba(${ink},0.86)`);
    } else {
      grad.addColorStop(0, `rgba(${ink},0.86)`);
      grad.addColorStop(0.50, `rgba(${ink},0.55)`);
      grad.addColorStop(1, `rgba(${ink},0)`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, scrimTop, W, scrimH);

    // --- Text layout ---
    const pad = Math.round(W * 0.082);
    const maxTextW = W - pad * 2;

    const headlineSize = Math.round(W * 0.076);
    const headlineLineH = Math.round(headlineSize * 1.16);
    const supportSize = Math.round(W * 0.038);
    const supportLineH = Math.round(supportSize * 1.42);
    const sigSize = Math.round(W * 0.034);

    ctx.fillStyle = textColor === 'black' ? '#111111' : '#ffffff';

    const headLines = headline
      ? (ctx.font = `${headlineSize}px ${boldFont}`, wrapText(ctx, headline.trim(), maxTextW))
      : [];
    const supportLines = supportingLine
      ? (ctx.font = `${supportSize}px ${regularFont}`, wrapText(ctx, supportingLine.trim(), maxTextW))
      : [];

    const headBlockH = headLines.length * headlineLineH;
    const supportBlockH = supportLines.length * supportLineH;
    const gapHeadSupport = headLines.length && supportLines.length ? Math.round(headlineSize * 0.5) : 0;
    const gapSupportSig = supportLines.length ? Math.round(sigSize * 1.1) : Math.round(headlineSize * 0.6);
    const totalTextH = headBlockH + gapHeadSupport + supportBlockH + gapSupportSig + sigSize;

    // Vertical placement
    let startY: number;
    if (textPosition === 'top') {
      startY = pad + headlineSize;
    } else if (textPosition === 'center') {
      startY = Math.round((H - totalTextH) / 2) + headlineSize;
    } else {
      startY = H - pad - totalTextH + headlineSize;
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    let y = startY;
    if (headLines.length) {
      ctx.font = `${headlineSize}px ${boldFont}`;
      for (const line of headLines) { ctx.fillText(line, pad, y); y += headlineLineH; }
    }
    y += gapHeadSupport;
    if (supportLines.length) {
      ctx.font = `${supportSize}px ${regularFont}`;
      for (const line of supportLines) { ctx.fillText(line, pad, y); y += supportLineH; }
    }
    y += gapSupportSig;
    // Signature — always exactly iRoxanne Studio (validated caller-side too).
    ctx.font = `${sigSize}px ${boldFont}`;
    ctx.fillText(String(signature || 'iRoxanne Studio').trim(), pad, y);

    // --- Encode PNG (no streams) ---
    const pngBytes = await encodeCanvasToPNG(canvas);
    if (!pngBytes || pngBytes.byteLength < 1000) {
      return Response.json({ ok: false, error: 'PNG encoding produced no usable data. The previous asset was preserved.' }, { status: 500 });
    }

    // --- Upload the finished graphic ---
    const file = new File([pngBytes], 'studio-graphic.png', { type: 'image/png' });
    const upload = await base44.integrations.Core.UploadPublicFile({ file });
    const imageUrl = upload?.file_url || upload?.url;
    if (!imageUrl || typeof imageUrl !== 'string' || !/^https?:\/\//.test(imageUrl)) {
      return Response.json({ ok: false, error: 'Upload failed. The previous asset was preserved.' }, { status: 502 });
    }

    // --- Save to the Gallery library ---
    const effPlatform = post?.platform || '';
    const effFormat = post?.format || '';
    const effCampaignId = campaignId || post?.campaign_id || '';
    const effPortfolioItemId = portfolioItemId || post?.portfolio_item_id || '';

    let previous_version_id = '';
    if (post && previous_image_url) {
      const prior = await base44.entities.GalleryImage.filter({ post_id: post.id, image_url: previous_image_url }).catch(() => []);
      previous_version_id = prior?.[0]?.id || '';
    }

    const media = await base44.entities.GalleryImage.create({
      title: `${effPortfolioItemId && effPortfolioItemId !== '__studio_service__' ? 'Studio' : 'iRoxanne Studio'} composed graphic (${ar})`,
      image_url: imageUrl,
      category: 'promo',
      source: 'upload',
      visual_direction: { ...visualDirection, aspect_ratio: ar, composed: true, platform: effPlatform, format: effFormat },
      platform: effPlatform,
      format: effFormat,
      aspect_ratio: ar,
      post_id: post?.id || '',
      campaign_id: effCampaignId,
      portfolio_item_id: effPortfolioItemId,
      generation_status: 'approved',
      generated_at: new Date().toISOString(),
      previous_version_id,
      description: `Composed non-generative graphic. Headline: ${headline || '(none)'}. Signature: ${signature || 'iRoxanne Studio'}.`,
    });

    // --- Attach to the draft post without touching approval/publish state ---
    let attached = false;
    if (post) {
      await base44.entities.MarketingPost.update(post.id, {
        media_file_url: imageUrl,
        media_url: imageUrl,
        media_clip_id: '',
        gallery_image_id: media.id,
        media_type: 'image',
        // Keep current status/approval — never auto-approve or auto-schedule.
      });
      attached = true;
    }

    return Response.json({
      ok: true,
      media_id: media.id,
      image_url: imageUrl,
      post_id: post?.id || null,
      aspect_ratio: ar,
      pixel_size: `${W}x${H}`,
      previous_image_url: previous_image_url || null,
      previous_version_id: previous_version_id || null,
      status: 'composed',
      attached,
      message: attached
        ? 'Composed graphic created, uploaded, and attached to the draft. The post remains Pending Review.'
        : 'Composed graphic created and uploaded. No post was attached.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Composition failed.' }, { status: 500 });
  }
}