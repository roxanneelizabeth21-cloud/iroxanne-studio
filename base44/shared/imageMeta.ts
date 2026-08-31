// Reads the real pixel dimensions + MIME type of a remote image by fetching
// only its header bytes. Social crawlers render a preview card immediately when
// og:image:width/height are declared; without them Facebook has to download and
// measure the image itself, which silently drops the image from the first scrape
// for larger files — the reason some releases previewed with art and others
// didn't. Measuring here makes every release behave identically.

export type ImageMeta = { url: string; width: number; height: number; type: string };

export async function probeImage(url: string): Promise<ImageMeta | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  let bytes: Uint8Array;
  let type = "";
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-65535" } });
    if (!res.ok && res.status !== 206) return null;
    type = (res.headers.get("content-type") || "").split(";")[0].trim();
    bytes = new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }

  const size = pngSize(bytes) || jpegSize(bytes) || gifSize(bytes) || webpSize(bytes);
  if (!size) return null;
  return { url, width: size.w, height: size.h, type: type || guessType(bytes) };
}

function u32(b: Uint8Array, i: number) {
  return ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
}

function pngSize(b: Uint8Array) {
  if (b.length < 24 || b[0] !== 0x89 || b[1] !== 0x50 || b[2] !== 0x4e || b[3] !== 0x47) return null;
  return { w: u32(b, 16), h: u32(b, 20) };
}

function jpegSize(b: Uint8Array) {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    // Start-of-frame markers carry the dimensions; skip DHT/DAC/RST variants.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { w: (b[i + 7] << 8) | b[i + 8], h: (b[i + 5] << 8) | b[i + 6] };
    }
    const len = (b[i + 2] << 8) | b[i + 3];
    if (len <= 0) return null;
    i += 2 + len;
  }
  return null;
}

function gifSize(b: Uint8Array) {
  if (b.length < 10 || b[0] !== 0x47 || b[1] !== 0x49 || b[2] !== 0x46) return null;
  return { w: b[6] | (b[7] << 8), h: b[8] | (b[9] << 8) };
}

function webpSize(b: Uint8Array) {
  if (b.length < 30 || b[8] !== 0x57 || b[9] !== 0x45 || b[10] !== 0x42 || b[11] !== 0x50) return null;
  const fmt = String.fromCharCode(b[12], b[13], b[14], b[15]);
  if (fmt === "VP8 ") return { w: ((b[26] | (b[27] << 8)) & 0x3fff), h: ((b[28] | (b[29] << 8)) & 0x3fff) };
  if (fmt === "VP8L") {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (fmt === "VP8X") return { w: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1, h: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1 };
  return null;
}

function guessType(b: Uint8Array) {
  if (pngSize(b)) return "image/png";
  if (jpegSize(b)) return "image/jpeg";
  if (gifSize(b)) return "image/gif";
  if (webpSize(b)) return "image/webp";
  return "image/jpeg";
}