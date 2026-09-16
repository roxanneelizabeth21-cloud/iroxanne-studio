import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import jpeg from 'npm:jpeg-js@0.4.4';
import { PNG } from 'npm:pngjs@7.0.0';
import opentype from 'npm:opentype.js@1.3.4';
import { Buffer } from 'node:buffer';

// composeMarketingGraphic — non-generative image composition.
// Takes an EXISTING image URL, composes it with exact marketing text
// (headline, supporting line, signature), renders a finished PNG at the
// requested aspect ratio, uploads it, saves a GalleryImage record, and
// attaches it to the identified draft post. No AI image generation, no
// approval, no scheduling, no publishing. Preserves the previous asset URL
// for recovery.
//
// Rendering is done entirely in pure JS: pngjs/jpeg-js for decode, opentype.js
// for font glyph paths, and a custom scanline rasterizer for text fill — no
// browser canvas required (Deno has no DOM).

const SIZES: Record<string, { w: number; h: number }> = {
  '4:5': { w: 1080, h: 1350 },
  '1:1': { w: 1080, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '16:9': { w: 1920, h: 1080 },
};

// ---------------------------------------------------------------------------
// Font loading (opentype.js — pure JS, no DOM)
// ---------------------------------------------------------------------------

type Font = any;
const fonts: { bold?: Font; regular?: Font; black?: Font } = {};
let fontPromise: Promise<void> | null = null;

function loadFonts(): Promise<void> {
  if (fontPromise) return fontPromise;
  fontPromise = (async () => {
    const base = 'https://cdn.jsdelivr.net/fontsource/fonts/lato@latest';
    const sources: [keyof typeof fonts, string][] = [
      ['black', `${base}/latin-900-normal.ttf`],
      ['bold', `${base}/latin-700-normal.ttf`],
      ['regular', `${base}/latin-400-normal.ttf`],
    ];
    for (const [key, url] of sources) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        fonts[key] = opentype.parse(buf);
      } catch { /* skip */ }
    }
    if (!fonts.bold) fonts.bold = fonts.black || fonts.regular;
    if (!fonts.regular) fonts.regular = fonts.bold;
    if (!fonts.black) fonts.black = fonts.bold;
  })();
  return fontPromise;
}

function pickFont(pref: ('black' | 'bold' | 'regular')[]): Font {
  for (const p of pref) if (fonts[p]) return fonts[p];
  return fonts.bold || fonts.regular || null;
}

// ---------------------------------------------------------------------------
// Image buffer helpers
// ---------------------------------------------------------------------------

interface Img { width: number; height: number; data: Uint8Array; }

function newImg(w: number, h: number, fill: [number, number, number]): Img {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = fill[0];
    data[i * 4 + 1] = fill[1];
    data[i * 4 + 2] = fill[2];
    data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data };
}

function blendPixel(img: Img, x: number, y: number, r: number, g: number, b: number, a: number) {
  if (a <= 0) return;
  if (a >= 1) { img.data[(y * img.width + x) * 4] = r; img.data[(y * img.width + x) * 4 + 1] = g; img.data[(y * img.width + x) * 4 + 2] = b; return; }
  const idx = (y * img.width + x) * 4;
  const ia = 1 - a;
  img.data[idx] = Math.round(img.data[idx] * ia + r * a);
  img.data[idx + 1] = Math.round(img.data[idx + 1] * ia + g * a);
  img.data[idx + 2] = Math.round(img.data[idx + 2] * ia + b * a);
}

function fillRect(img: Img, x0: number, y0: number, x1: number, y1: number, r: number, g: number, b: number, a: number) {
  const xa = Math.max(0, Math.floor(x0)), xb = Math.min(img.width - 1, Math.ceil(x1));
  const ya = Math.max(0, Math.floor(y0)), yb = Math.min(img.height - 1, Math.ceil(y1));
  for (let y = ya; y <= yb; y++)
    for (let x = xa; x <= xb; x++)
      blendPixel(img, x, y, r, g, b, a);
}

function fillGradientV(img: Img, x0: number, y0: number, w: number, h: number, stops: { t: number; r: number; g: number; b: number; a: number }[]) {
  const xa = Math.max(0, Math.floor(x0)), xb = Math.min(img.width - 1, Math.floor(x0 + w));
  const ya = Math.max(0, Math.floor(y0)), yb = Math.min(img.height - 1, Math.floor(y0 + h));
  for (let y = ya; y <= yb; y++) {
    const t = h > 0 ? (y - y0) / h : 0;
    // Interpolate between stops
    let r = stops[0].r, g = stops[0].g, b = stops[0].b, a = stops[0].a;
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].t && t <= stops[i + 1].t) {
        const span = stops[i + 1].t - stops[i].t || 1;
        const lt = (t - stops[i].t) / span;
        r = Math.round(stops[i].r * (1 - lt) + stops[i + 1].r * lt);
        g = Math.round(stops[i].g * (1 - lt) + stops[i + 1].g * lt);
        b = Math.round(stops[i].b * (1 - lt) + stops[i + 1].b * lt);
        a = stops[i].a * (1 - lt) + stops[i + 1].a * lt;
        break;
      }
    }
    // Beyond last stop — clamp to last
    if (t > stops[stops.length - 1].t) { r = stops[stops.length - 1].r; g = stops[stops.length - 1].g; b = stops[stops.length - 1].b; a = stops[stops.length - 1].a; }
    for (let x = xa; x <= xb; x++)
      blendPixel(img, x, y, r, g, b, a);
  }
}

function drawImageCover(target: Img, src: Img, dw: number, dh: number, dx: number, dy: number) {
  // Nearest-neighbor cover-fit blit (crop overflow).
  const sx0 = dx < 0 ? -dx : 0;
  const sy0 = dy < 0 ? -dy : 0;
  const sx1 = Math.min(dw, target.width - dx) - sx0;
  const sy1 = Math.min(dh, target.height - dy) - sy0;
  for (let ty = 0; ty < sy1; ty++) {
    const sy = Math.floor((sy0 + ty) / dh * src.height);
    for (let tx = 0; tx < sx1; tx++) {
      const sx = Math.floor((sx0 + tx) / dw * src.width);
      const si = (sy * src.width + sx) * 4;
      const ti = ((dy + ty + sy0) * target.width + (dx + tx + sx0)) * 4;
      target.data[ti] = src.data[si];
      target.data[ti + 1] = src.data[si + 1];
      target.data[ti + 2] = src.data[si + 2];
      target.data[ti + 3] = 255;
    }
  }
}

async function decodeSourceImage(url: string): Promise<Img> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch source image (HTTP ${res.status}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 3) throw new Error('Source image is empty or unreadable.');
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    const png = PNG.sync.read(buf);
    return { width: png.width, height: png.height, data: new Uint8Array(png.data) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    const raw = jpeg.decode(buf, { useTArray: true });
    return { width: raw.width, height: raw.height, data: new Uint8Array(raw.data) };
  }
  throw new Error('Unsupported image format (only PNG and JPEG are supported).');
}

function encodePNG(img: Img): Uint8Array {
  const png = new PNG({ width: img.width, height: img.height });
  png.data.set(img.data);
  const out = PNG.sync.write(png);
  return new Uint8Array(out.buffer, out.byteOffset, out.byteLength);
}

// ---------------------------------------------------------------------------
// Text rendering (scanline rasterizer via opentype.js glyph paths)
// ---------------------------------------------------------------------------

function measureText(font: Font, text: string, fontSize: number): number {
  return font.getAdvanceWidth(text, fontSize);
}

function wrapText(font: Font, text: string, maxWidth: number, fontSize: number): string[] {
  const lines: string[] = [];
  for (const paragraph of String(text).split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (measureText(font, test, fontSize) > maxWidth && line) {
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

interface Edge { x1: number; y1: number; x2: number; y2: number; }

function flattenPath(commands: any[], x: number, y: number): Edge[] {
  const edges: Edge[] = [];
  let cx = x, cy = y, sx = x, sy = y;
  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M':
        cx = x + cmd.x; cy = y + cmd.y; sx = cx; sy = cy;
        break;
      case 'L':
        edges.push({ x1: cx, y1: cy, x2: x + cmd.x, y2: y + cmd.y });
        cx = x + cmd.x; cy = y + cmd.y;
        break;
      case 'Q': {
        const steps = 6;
        const px = cx, py = cy;
        const c1x = x + cmd.x1, c1y = y + cmd.y1;
        const ex = x + cmd.x, ey = y + cmd.y;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps, mt = 1 - t;
          const nx = mt * mt * px + 2 * mt * t * c1x + t * t * ex;
          const ny = mt * mt * py + 2 * mt * t * c1y + t * t * ey;
          edges.push({ x1: cx, y1: cy, x2: nx, y2: ny });
          cx = nx; cy = ny;
        }
        break;
      }
      case 'C': {
        const steps = 10;
        const px = cx, py = cy;
        const c1x = x + cmd.x1, c1y = y + cmd.y1;
        const c2x = x + cmd.x2, c2y = y + cmd.y2;
        const ex = x + cmd.x, ey = y + cmd.y;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps, mt = 1 - t;
          const nx = mt * mt * mt * px + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * ex;
          const ny = mt * mt * mt * py + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * ey;
          edges.push({ x1: cx, y1: cy, x2: nx, y2: ny });
          cx = nx; cy = ny;
        }
        break;
      }
      case 'Z':
        if (cx !== sx || cy !== sy) edges.push({ x1: cx, y1: cy, x2: sx, y2: sy });
        cx = sx; cy = sy;
        break;
    }
  }
  return edges;
}

function fillText(img: Img, font: Font, text: string, x: number, baselineY: number, fontSize: number, color: [number, number, number]) {
  if (!text || !font) return;
  const [r, g, b] = color;
  const glyphs = font.stringToGlyphs(text);
  let penX = x;
  for (const glyph of glyphs) {
    if (glyph.unicode !== 32 && glyph.index !== 0) {
      const path = glyph.getPath(penX, baselineY, fontSize);
      const edges = flattenPath(path.commands, 0, 0);
      if (edges.length) {
        let minY = Infinity, maxY = -Infinity;
        for (const e of edges) { minY = Math.min(minY, e.y1, e.y2); maxY = Math.max(maxY, e.y1, e.y2); }
        const yStart = Math.max(0, Math.floor(minY));
        const yEnd = Math.min(img.height - 1, Math.ceil(maxY));
        for (let y = yStart; y <= yEnd; y++) {
          const yc = y + 0.5; // sample at pixel center
          const xs: number[] = [];
          for (const e of edges) {
            const y1 = e.y1, y2 = e.y2;
            if ((y1 <= yc && y2 > yc) || (y2 <= yc && y1 > yc)) {
              xs.push(e.x1 + (yc - y1) / (y2 - y1) * (e.x2 - e.x1));
            }
          }
          xs.sort((a, c) => a - c);
          for (let i = 0; i + 1 < xs.length; i += 2) {
            const xa = Math.max(0, Math.floor(xs[i]));
            const xb = Math.min(img.width - 1, Math.ceil(xs[i + 1]));
            for (let xi = xa; xi <= xb; xi++) blendPixel(img, xi, y, r, g, b, 1);
          }
        }
      }
    }
    penX += glyph.advanceWidth * (fontSize / font.unitsPerEm);
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async function (req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));

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
    await loadFonts();
    const boldFont = pickFont(['black', 'bold', 'regular']);
    const regularFont = pickFont(['regular', 'bold', 'black']);
    if (!boldFont) return Response.json({ ok: false, error: 'Font loading failed. No fonts available.' }, { status: 500 });

    // --- Decode the source photo ---
    const src = await decodeSourceImage(image_url);

    // --- Create the output canvas ---
    const inkColor: [number, number, number] = textColor === 'black' ? [17, 17, 17] : [255, 255, 255];
    const scrimInk = textColor === 'black' ? [255, 255, 255] : [0, 0, 0];
    const canvas = newImg(W, H, [21, 19, 26]);

    // Cover-fit the source image
    const scale = Math.max(W / src.width, H / src.height);
    const dw = Math.round(src.width * scale);
    const dh = Math.round(src.height * scale);
    const dx = Math.round((W - dw) / 2);
    const dy = Math.round((H - dh) / 2);
    drawImageCover(canvas, src, dw, dh, dx, dy);

    // --- Scrim for text legibility ---
    const scrimH = Math.round(H * 0.62);
    const scrimTop = textPosition === 'bottom' ? H - scrimH : 0;
    if (textPosition === 'bottom') {
      fillGradientV(canvas, 0, scrimTop, W, scrimH, [
        { t: 0, r: scrimInk[0], g: scrimInk[1], b: scrimInk[2], a: 0 },
        { t: 0.30, r: scrimInk[0], g: scrimInk[1], b: scrimInk[2], a: 0.45 },
        { t: 0.70, r: scrimInk[0], g: scrimInk[1], b: scrimInk[2], a: 0.78 },
        { t: 1, r: scrimInk[0], g: scrimInk[1], b: scrimInk[2], a: 0.86 },
      ]);
    } else {
      fillGradientV(canvas, 0, scrimTop, W, scrimH, [
        { t: 0, r: scrimInk[0], g: scrimInk[1], b: scrimInk[2], a: 0.86 },
        { t: 0.50, r: scrimInk[0], g: scrimInk[1], b: scrimInk[2], a: 0.55 },
        { t: 1, r: scrimInk[0], g: scrimInk[1], b: scrimInk[2], a: 0 },
      ]);
    }

    // --- Text layout ---
    const pad = Math.round(W * 0.082);
    const maxTextW = W - pad * 2;

    const headlineSize = Math.round(W * 0.076);
    const headlineLineH = Math.round(headlineSize * 1.16);
    const supportSize = Math.round(W * 0.038);
    const supportLineH = Math.round(supportSize * 1.42);
    const sigSize = Math.round(W * 0.034);

    const headLines = headline ? wrapText(boldFont, headline.trim(), maxTextW, headlineSize) : [];
    const supportLines = supportingLine ? wrapText(regularFont, supportingLine.trim(), maxTextW, supportSize) : [];

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

    let y = startY;
    if (headLines.length) {
      for (const line of headLines) { fillText(canvas, boldFont, line, pad, y, headlineSize, inkColor); y += headlineLineH; }
    }
    y += gapHeadSupport;
    if (supportLines.length) {
      for (const line of supportLines) { fillText(canvas, regularFont, line, pad, y, supportSize, inkColor); y += supportLineH; }
    }
    y += gapSupportSig;
    fillText(canvas, boldFont, String(signature || 'iRoxanne Studio').trim(), pad, y, sigSize, inkColor);

    // --- Encode PNG ---
    const pngBytes = encodePNG(canvas);
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
      title: `iRoxanne Studio composed graphic (${ar})`,
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