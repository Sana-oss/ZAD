/**
 * Premium Quote Image Generator Service — "Museum Edition"
 *
 * Composition layers:
 *   1. Deep warm-brown backdrop with 3-stop gradient + radial glow + vignette
 *   2. Faint Islamic geometric lattice (eight-point stars / girih-style tiling)
 *   3. Floating parchment panel (rounded, soft drop-shadow) with double gold
 *      frame, corner rosettes, and mid-edge diamond finials
 *   4. Editorial typography: category seal, serif quote block with oversized
 *      gold quote marks, gold diamond divider, source/author hierarchy
 *   5. Branding row on the bottom mat with flanking stars
 *   6. Film-grain pass over everything for a printed, tactile finish
 *
 * Formats: Instagram (4:5), Pinterest (2:3), Twitter (16:9).
 */

import { Quote } from './quoteService';

export type QuoteImageFormat = 'instagram' | 'pinterest' | 'twitter';

interface FormatDimensions {
  width: number;
  height: number;
}

const FORMAT_DIMENSIONS: Record<QuoteImageFormat, FormatDimensions> = {
  instagram: { width: 1080, height: 1350 },
  pinterest: { width: 1000, height: 1500 },
  twitter: { width: 1200, height: 675 },
};

/* ----------------------------- palette ----------------------------- */

const BACK_TOP = '#382512';
const BACK_MID = '#7A5730';
const BACK_LOW = '#C79A5F';

const PANEL_TOP = '#FCF6EA';
const PANEL_BOTTOM = '#F2E5CB';

const GOLD = '#B98A3C';
const GOLD_LIGHT = '#D9B36A';
const INK = '#2A2118';
const SOURCE_COLOR = '#8B6914';
const AUTHOR_COLOR = '#5D4423';
const BRAND_COLOR = '#EDDCB4';

const ARABIC_FONT_STACK = '"IBM Plex Sans Arabic", "Tajawal", sans-serif';
const SERIF_STACK = '"Georgia", serif';

type CtxWithLetterSpacing = CanvasRenderingContext2D & {
  letterSpacing?: string;
};

export class PremiumQuoteImageService {
  static async generatePremiumImage(
    quote: Quote,
    format: QuoteImageFormat = 'instagram',
    preferArabic = false
  ): Promise<Blob> {
    try {
      await Promise.all([
        document.fonts.load(`bold 52px ${ARABIC_FONT_STACK}`),
        document.fonts.load(`bold 52px ${SERIF_STACK}`),
        document.fonts.ready,
      ]);
    } catch {
      // Font loading API unavailable — system fallbacks will be used.
    }

    const { width, height } = FORMAT_DIMENSIONS[format];
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    /* ------------------------- backdrop ------------------------- */

    this.drawBackdrop(ctx, width, height);
    this.drawGeometricLattice(ctx, width, height);
    this.drawVignette(ctx, width, height);

    /* ---------------------- parchment panel --------------------- */

    const mX = width * 0.075;
    const mTop = height * (format === 'twitter' ? 0.11 : 0.13);
    const mBottom = mTop;
    const px = mX;
    const py = mTop;
    const pw = width - mX * 2;
    const ph = height - mTop - mBottom;

    this.drawPanel(ctx, px, py, pw, ph);

    /* ------------------------ content --------------------------- */

    const padX = pw * 0.115;
    const contentLeft = px + padX;
    const contentWidth = pw - padX * 2;
    const unit = Math.min(pw, ph);

    // Vertical layout, computed bottom-up so text never collides.
    const padIn = ph * 0.075;
    const pillFS = Math.max(13, Math.round(unit * 0.021));
    const pillH = Math.round(pillFS * 2.1);
    const pillY = py + padIn;

    const srcFS = Math.max(17, Math.round(unit * 0.026));
    const autFS = Math.max(19, Math.round(unit * 0.03));
    const gapSmall = Math.round(unit * 0.03);

    const attrBottom = py + ph - padIn * 0.85;
    const authorY = attrBottom;
    const sourceY = quote.author && quote.source ? authorY - autFS * 1.75 : authorY;
    const dividerY =
      quote.source || quote.author
        ? Math.min(sourceY, authorY) - (quote.author && quote.source ? autFS * 0.55 : srcFS * 0.9) - gapSmall
        : 0;

    const textZoneTop = pillY + pillH + gapSmall * 1.4;
    const textZoneBottom = dividerY > 0 ? dividerY - gapSmall * 1.6 : attrBottom - unit * 0.06;

    // Category seal
    if (quote.category) {
      this.drawSeal(ctx, quote.category, width / 2, pillY, pillFS, pillH, contentWidth);
    }

    // Quote block — kept deliberately clean; this feature carries no
    // scripture-specific ornamentation.
    const useArabic = preferArabic && !!quote.textAr;
    const primary = useArabic ? quote.textAr! : quote.text;
    this.drawQuoteBlock(
      ctx,
      primary,
      contentLeft,
      contentWidth,
      textZoneTop,
      textZoneBottom,
      useArabic
    );

    // Optional Arabic echo beneath Latin text
    if (!useArabic && quote.textAr && dividerY > 0) {
      const arFS = Math.max(16, Math.round(unit * 0.024));
      ctx.font = `${arFS}px ${ARABIC_FONT_STACK}`;
      ctx.direction = 'rtl';
      ctx.fillStyle = AUTHOR_COLOR;
      ctx.textAlign = 'center';
      const clipped = this.clipToLines(ctx, quote.textAr, contentWidth, 1);
      ctx.fillText(
        clipped[0] ?? '',
        width / 2,
        dividerY > 0 ? (textZoneBottom + dividerY) / 2 : textZoneBottom + gapSmall * 0.4
      );
      ctx.direction = 'inherit';
    }

    // Divider + attribution
    if (dividerY > 0) {
      this.drawDiamondDivider(ctx, width / 2, dividerY, pw * 0.16);
    }
    if (quote.source) {
      ctx.font = `italic ${srcFS}px ${SERIF_STACK}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = SOURCE_COLOR;
      ctx.fillText(`— ${this.clipLine(ctx, quote.source, contentWidth)}`, width / 2, sourceY);
    }
    if (quote.author) {
      ctx.font = `bold ${autFS}px ${SERIF_STACK}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = AUTHOR_COLOR;
      ctx.fillText(this.clipLine(ctx, quote.author, contentWidth), width / 2, authorY);
    }

    /* ------------------------ branding -------------------------- */

    this.drawBrandRow(ctx, width, height, mBottom);

    /* -------------------- finishing grain ----------------------- */

    this.applyFilmGrain(ctx, width, height);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))),
        'image/png',
        0.95
      );
    });
  }

  /* ========================= backdrop ========================== */

  private static drawBackdrop(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, BACK_TOP);
    g.addColorStop(0.55, BACK_MID);
    g.addColorStop(1, BACK_LOW);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(
      width / 2,
      height * 0.42,
      0,
      width / 2,
      height * 0.42,
      Math.max(width, height) * 0.72
    );
    glow.addColorStop(0, 'rgba(255, 236, 200, 0.20)');
    glow.addColorStop(0.6, 'rgba(255, 236, 200, 0.05)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  /** Tiled eight-point-star lattice, whisper-faint over the backdrop. */
  private static drawGeometricLattice(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const cell = Math.min(width, height) * 0.155;
    const r = cell * 0.34;

    ctx.save();
    ctx.strokeStyle = 'rgba(222, 186, 120, 0.10)';
    ctx.lineWidth = 1.4;

    // Connecting lattice lines
    ctx.beginPath();
    for (let x = cell / 2; x < width + cell; x += cell) {
      ctx.moveTo(x, -cell);
      ctx.lineTo(x, height + cell);
    }
    for (let y = cell / 2; y < height + cell; y += cell) {
      ctx.moveTo(-cell, y);
      ctx.lineTo(width + cell, y);
    }
    ctx.stroke();

    // Stars at intersections
    for (let x = cell / 2; x < width + cell; x += cell) {
      for (let y = cell / 2; y < height + cell; y += cell) {
        this.strokeEightPointStar(ctx, x, y, r);
      }
    }
    ctx.restore();
  }

  private static strokeEightPointStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number
  ): void {
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 2; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 4);
      ctx.strokeRect(-r, -r, r * 2, r * 2);
      ctx.restore();
    }
    ctx.restore();
  }

  private static drawVignette(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const v = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.35,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.78
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(24, 14, 4, 0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, width, height);
  }

  /* =========================== panel =========================== */

  private static roundRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  private static drawPanel(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const radius = Math.min(w, h) * 0.045;

    // Drop shadow lift
    ctx.save();
    ctx.shadowColor = 'rgba(30, 18, 5, 0.5)';
    ctx.shadowBlur = Math.min(w, h) * 0.09;
    ctx.shadowOffsetY = Math.min(w, h) * 0.028;

    const pg = ctx.createLinearGradient(x, y, x, y + h);
    pg.addColorStop(0, PANEL_TOP);
    pg.addColorStop(1, PANEL_BOTTOM);
    ctx.fillStyle = pg;
    this.roundRectPath(ctx, x, y, w, h, radius);
    ctx.fill();
    ctx.restore();

    // Warm rim light along the top edge
    ctx.save();
    this.roundRectPath(ctx, x, y, w, h, radius);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Double gold frame
    const o = Math.min(w, h) * 0.028;
    this.roundRectPath(ctx, x + o, y + o, w - o * 2, h - o * 2, radius * 0.72);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.stroke();

    const i = o + Math.min(w, h) * 0.012;
    this.roundRectPath(ctx, x + i, y + i, w - i * 2, h - i * 2, radius * 0.55);
    ctx.strokeStyle = 'rgba(185, 138, 60, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Corner rosettes on the outer frame
    const rosetteR = Math.min(w, h) * 0.011;
    const cs: Array<[number, number]> = [
      [x + o, y + o],
      [x + w - o, y + o],
      [x + o, y + h - o],
      [x + w - o, y + h - o],
    ];
    for (const [cx, cy] of cs) {
      ctx.fillStyle = GOLD_LIGHT;
      ctx.beginPath();
      ctx.arc(cx, cy, rosetteR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(cx, cy, rosetteR * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }

    // Diamond finials mid top/bottom edges
    const dm = rosetteR * 1.15;
    for (const cy of [y + o, y + h - o]) {
      ctx.save();
      ctx.translate(x + w / 2, cy);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = GOLD;
      ctx.fillRect(-dm, -dm, dm * 2, dm * 2);
      ctx.restore();
    }
  }

  /* ========================== content ========================== */

  private static drawSeal(
    ctx: CanvasRenderingContext2D,
    label: string,
    centerX: number,
    y: number,
    fs: number,
    pillH: number,
    maxW: number
  ): void {
    const text = label.toUpperCase().slice(0, 22);
    ctx.font = `bold ${fs}px ${SERIF_STACK}`;
    try {
      (ctx as CtxWithLetterSpacing).letterSpacing = `${Math.max(2, fs * 0.22)}px`;
    } catch {
      /* letterSpacing unsupported — plain text */
    }
    let tw = ctx.measureText(text).width;
    // letterSpacing inflates measure inconsistently across engines; pad safely
    tw += text.length * fs * 0.1;
    const pw = Math.min(maxW, tw + fs * 2.4);

    ctx.save();
    this.roundRectPath(ctx, centerX - pw / 2, y, pw, pillH, pillH / 2);
    ctx.fillStyle = 'rgba(185, 138, 60, 0.14)';
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = SOURCE_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, centerX, y + pillH / 2 + fs * 0.05);
    ctx.restore();

    try {
      (ctx as CtxWithLetterSpacing).letterSpacing = '0px';
    } catch {
      /* noop */
    }
    ctx.textBaseline = 'alphabetic';
  }

  /** Shrink-to-fit quote block centered inside [top, bottom]. */
  private static drawQuoteBlock(
    ctx: CanvasRenderingContext2D,
    text: string,
    left: number,
    width: number,
    top: number,
    bottom: number,
    isArabic: boolean
  ): void {
    const zoneH = Math.max(60, bottom - top);
    const cx = left + width / 2;
    const isLatin = !isArabic && !/[\u0600-\u06FF]/.test(text.charAt(0));

    const base = Math.round(Math.min(width, zoneH) * (isLatin ? 0.105 : 0.118));
    const minFS = Math.max(22, Math.round(base * 0.42));

    let fontSize = base;
    let lines: string[];
    let lineHeight: number;

    for (;;) {
      ctx.font = `bold ${fontSize}px ${isLatin ? SERIF_STACK : ARABIC_FONT_STACK}`;
      lineHeight = Math.round(fontSize * 1.42);
      lines = this.wrapText(ctx, text, width);
      if (lines.length * lineHeight <= zoneH || fontSize <= minFS) break;
      fontSize -= 2;
    }

    const totalH = lines.length * lineHeight;
    const startY = top + (zoneH - totalH) / 2 + lineHeight * 0.34;

    ctx.save();
    ctx.direction = isLatin ? 'ltr' : 'rtl';
    ctx.textAlign = 'center';

    // Soft ink shadow for print depth
    ctx.shadowColor = 'rgba(70, 50, 20, 0.22)';
    ctx.shadowBlur = fontSize * 0.12;
    ctx.shadowOffsetY = fontSize * 0.035;

    // Main text — subtle two-tone ink gradient
    const grad = ctx.createLinearGradient(cx, startY - lineHeight, cx, startY + totalH);
    grad.addColorStop(0, INK);
    grad.addColorStop(1, '#463526');
    ctx.fillStyle = grad;
    ctx.font = `bold ${fontSize}px ${isLatin ? SERIF_STACK : ARABIC_FONT_STACK}`;

    lines.forEach((line, idx) => {
      ctx.fillText(line, cx, startY + idx * lineHeight);
    });

    ctx.restore();
  }

  private static drawDiamondDivider(
    ctx: CanvasRenderingContext2D,
    cx: number,
    y: number,
    span: number
  ): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(139, 105, 20, 0.55)';
    ctx.lineWidth = 1.4;

    const armEnd = span / 2;
    const armStart = span * 0.16;

    ctx.beginPath();
    ctx.moveTo(cx - armEnd, y);
    ctx.lineTo(cx - armStart, y);
    ctx.moveTo(cx + armStart, y);
    ctx.lineTo(cx + armEnd, y);
    ctx.stroke();

    const d = Math.max(5, span * 0.05);
    ctx.translate(cx, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = GOLD;
    ctx.fillRect(-d, -d, d * 2, d * 2);
    ctx.strokeStyle = GOLD_LIGHT;
    ctx.lineWidth = 1;
    ctx.strokeRect(-d, -d, d * 2, d * 2);
    ctx.restore();
  }

  /* ========================== branding ========================= */

  private static drawBrandRow(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    matBottom: number
  ): void {
    const cy = height - matBottom * 0.52;
    const fs = Math.max(15, Math.round(matBottom * 0.3));

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.font = `bold ${fs}px ${ARABIC_FONT_STACK}`;
    ctx.fillStyle = BRAND_COLOR;

    const label = 'زاد ZAD';
    const tw = ctx.measureText(label).width;
    ctx.fillText(label, width / 2, cy);

    // Flanking rules with terminal stars
    const gap = tw / 2 + fs * 1.1;
    const ruleLen = Math.min(width * 0.16, fs * 7);
    ctx.strokeStyle = 'rgba(217, 179, 106, 0.75)';
    ctx.lineWidth = 1.4;

    for (const dir of [-1, 1]) {
      const x0 = width / 2 + dir * gap;
      const x1 = x0 + dir * ruleLen;
      ctx.beginPath();
      ctx.moveTo(x0, cy);
      ctx.lineTo(x1, cy);
      ctx.stroke();

      ctx.save();
      ctx.translate(x1 + dir * fs * 0.55, cy);
      ctx.scale(fs / 40, fs / 40);
      ctx.strokeStyle = GOLD_LIGHT;
      ctx.lineWidth = 3;
      this.strokeEightPointStar(ctx, 0, 0, 11);
      ctx.restore();
    }

    ctx.restore();
    ctx.textBaseline = 'alphabetic';
    ctx.direction = 'inherit';
  }

  /* ====================== texture finish ======================= */

  private static applyFilmGrain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const size = 160;
    const nc = document.createElement('canvas');
    nc.width = size;
    nc.height = size;
    const nctx = nc.getContext('2d');
    if (!nctx) return;

    const img = nctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 16;
    }
    nctx.putImageData(img, 0, 0);

    const pattern = ctx.createPattern(nc, 'repeat');
    if (!pattern) return;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  /* ========================= utilities ========================= */

  private static wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const test = currentLine + (currentLine ? ' ' : '') + word;
      if (ctx.measureText(test).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Hard-break pathological single words longer than the column.
    return lines.flatMap((line) =>
      ctx.measureText(line).width <= maxWidth * 1.05
        ? [line]
        : this.breakLongWord(ctx, line, maxWidth)
    );
  }

  private static breakLongWord(
    ctx: CanvasRenderingContext2D,
    word: string,
    maxWidth: number
  ): string[] {
    const out: string[] = [];
    let chunk = '';
    for (const ch of word) {
      if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
        out.push(chunk);
        chunk = ch;
      } else {
        chunk += ch;
      }
    }
    if (chunk) out.push(chunk);
    return out;
  }

  private static clipToLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number
  ): string[] {
    const lines = this.wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) return lines;
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[^\u06FF]+$/, '') + '…';
    return kept;
  }

  private static clipLine(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let clipped = text;
    while (clipped.length > 1 && ctx.measureText(clipped + '…').width > maxWidth) {
      clipped = clipped.slice(0, -1);
    }
    return clipped + '…';
  }

  /* ===================== delivery helpers ====================== */

  static downloadImage(blob: Blob, filename = 'zad-quote.png'): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async copyToClipboard(blob: Blob): Promise<boolean> {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      return false;
    }
  }
}

export const premiumQuoteImageService = PremiumQuoteImageService;
