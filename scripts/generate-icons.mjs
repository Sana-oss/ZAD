import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'public', 'icons');

const GREEN = [0x3a, 0x5a, 0x40, 255];
const WHITE = [255, 255, 255, 255];

// ---- minimal PNG encoder ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- icon rasterizer (supersampled for clean edges) ----
function makeIcon(size, { maskable }) {
  const SS = 4;
  const big = size * SS;
  const buf = new Uint8Array(big * big * 4); // transparent
  const set = (x, y, c) => {
    if (x < 0 || y < 0 || x >= big || y >= big) return;
    const i = (y * big + x) * 4;
    buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = c[3];
  };
  const cx = big / 2, cy = big / 2;

  if (maskable) {
    for (let y = 0; y < big; y++) for (let x = 0; x < big; x++) set(x, y, GREEN);
  } else {
    const m = big * 0.06, r = big * 0.22;
    const corners = [[m, m], [big - m, m], [m, big - m], [big - m, big - m]];
    for (let y = 0; y < big; y++)
      for (let x = 0; x < big; x++) {
        let draw = x >= m && x < big - m && y >= m && y < big - m;
        if (!draw) {
          for (const [ccx, ccy] of corners) {
            const dx = x - ccx, dy = y - ccy;
            if (dx * dx + dy * dy <= r * r) { draw = true; break; }
          }
        }
        if (draw) set(x, y, GREEN);
      }
  }

  // crescent: white disc, then carve a green disc offset to the upper-right
  const R = big * (maskable ? 0.26 : 0.30);
  for (let y = 0; y < big; y++)
    for (let x = 0; x < big; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= R * R) set(x, y, WHITE);
    }
  const carveX = cx + R * 0.55, carveY = cy - R * 0.18;
  for (let y = 0; y < big; y++)
    for (let x = 0; x < big; x++) {
      const dx = x - carveX, dy = y - carveY;
      if (dx * dx + dy * dy <= R * R) set(x, y, GREEN);
    }

  // box-downsample (premultiplied alpha)
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * big + (x * SS + sx)) * 4;
          const alpha = buf[i + 3] / 255;
          r += buf[i] * alpha; g += buf[i + 1] * alpha; b += buf[i + 2] * alpha;
          a += buf[i + 3];
        }
      const oi = (y * size + x) * 4, n = SS * SS;
      out[oi] = r / n; out[oi + 1] = g / n; out[oi + 2] = b / n; out[oi + 3] = a / n;
    }
  return out;
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-192.png', size: 192, maskable: true },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
];

for (const t of targets) {
  const png = encodePNG(t.size, t.size, makeIcon(t.size, { maskable: t.maskable }));
  writeFileSync(path.join(OUT_DIR, t.file), png);
  console.log(`wrote ${t.file} (${png.length} bytes)`);
}
console.log('done.');
