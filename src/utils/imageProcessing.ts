import { Point, Quad, FilterMode } from '../types';

/**
 * Load an image from Data URL or path
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Pure client-side offline edge and corner detection for documents.
 * Analyzes luminance gradients and selects the 4 most prominent corner coordinates.
 */
export function autoDetectCorners(image: HTMLImageElement | HTMLCanvasElement): Quad {
  const width = image instanceof HTMLImageElement ? image.naturalWidth || image.width : image.width;
  const height = image instanceof HTMLImageElement ? image.naturalHeight || image.height : image.height;

  // Default fallback quad (8% padding inset from borders)
  const defaultQuad: Quad = {
    topLeft: { x: Math.round(width * 0.08), y: Math.round(height * 0.08) },
    topRight: { x: Math.round(width * 0.92), y: Math.round(height * 0.08) },
    bottomRight: { x: Math.round(width * 0.92), y: Math.round(height * 0.92) },
    bottomLeft: { x: Math.round(width * 0.08), y: Math.round(height * 0.92) },
  };

  try {
    // Process on a downscaled canvas for speed and noise reduction
    const scale = Math.min(1, 300 / Math.max(width, height));
    const sw = Math.max(50, Math.round(width * scale));
    const sh = Math.max(50, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return defaultQuad;

    ctx.drawImage(image, 0, 0, sw, sh);
    const imgData = ctx.getImageData(0, 0, sw, sh);
    const data = imgData.data;

    // 1. Grayscale luminance
    const gray = new Float32Array(sw * sh);
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // 2. Sobel edge magnitude
    const edges = new Float32Array(sw * sh);
    let maxGrad = 0;
    for (let y = 1; y < sh - 1; y++) {
      for (let x = 1; x < sw - 1; x++) {
        const idx = y * sw + x;
        // Horizontal gradient (Sobel Gx)
        const gx =
          -gray[idx - sw - 1] + gray[idx - sw + 1] +
          -2 * gray[idx - 1] + 2 * gray[idx + 1] +
          -gray[idx + sw - 1] + gray[idx + sw + 1];

        // Vertical gradient (Sobel Gy)
        const gy =
          -gray[idx - sw - 1] - 2 * gray[idx - sw] - gray[idx - sw + 1] +
          gray[idx + sw - 1] + 2 * gray[idx + sw] + gray[idx + sw + 1];

        const mag = Math.hypot(gx, gy);
        edges[idx] = mag;
        if (mag > maxGrad) maxGrad = mag;
      }
    }

    // 3. Search for corner candidates in the 4 quadrants
    const thresh = maxGrad * 0.25;
    const cx = sw / 2;
    const cy = sh / 2;

    let tl = { x: sw * 0.08, y: sh * 0.08, score: -1e9 };
    let tr = { x: sw * 0.92, y: sh * 0.08, score: -1e9 };
    let br = { x: sw * 0.92, y: sh * 0.92, score: -1e9 };
    let bl = { x: sw * 0.08, y: sh * 0.92, score: -1e9 };

    for (let y = 2; y < sh - 2; y++) {
      for (let x = 2; x < sw - 2; x++) {
        const mag = edges[y * sw + x];
        if (mag < thresh) continue;

        // Top-Left quadrant (minimize x + y)
        if (x < cx && y < cy) {
          const score = mag * 0.5 - (x + y);
          if (score > tl.score) tl = { x, y, score };
        }
        // Top-Right quadrant (maximize x - y)
        else if (x >= cx && y < cy) {
          const score = mag * 0.5 + (x - y);
          if (score > tr.score) tr = { x, y, score };
        }
        // Bottom-Right quadrant (maximize x + y)
        else if (x >= cx && y >= cy) {
          const score = mag * 0.5 + (x + y);
          if (score > br.score) br = { x, y, score };
        }
        // Bottom-Left quadrant (minimize x - y)
        else {
          const score = mag * 0.5 - (x - y);
          if (score > bl.score) bl = { x, y, score };
        }
      }
    }

    // Convert back to original scale
    const invScale = 1 / scale;
    const detected: Quad = {
      topLeft: { x: Math.max(0, Math.min(width, Math.round(tl.x * invScale))), y: Math.max(0, Math.min(height, Math.round(tl.y * invScale))) },
      topRight: { x: Math.max(0, Math.min(width, Math.round(tr.x * invScale))), y: Math.max(0, Math.min(height, Math.round(tr.y * invScale))) },
      bottomRight: { x: Math.max(0, Math.min(width, Math.round(br.x * invScale))), y: Math.max(0, Math.min(height, Math.round(br.y * invScale))) },
      bottomLeft: { x: Math.max(0, Math.min(width, Math.round(bl.x * invScale))), y: Math.max(0, Math.min(height, Math.round(bl.y * invScale))) },
    };

    // Sanity check: ensure quadrilateral is reasonably wide and tall
    const quadW = Math.hypot(detected.topRight.x - detected.topLeft.x, detected.topRight.y - detected.topLeft.y);
    const quadH = Math.hypot(detected.bottomLeft.x - detected.topLeft.x, detected.bottomLeft.y - detected.topLeft.y);

    if (quadW > width * 0.35 && quadH > height * 0.35) {
      return detected;
    }
    return defaultQuad;
  } catch {
    return defaultQuad;
  }
}

/**
 * Solve 3x3 Homography matrix mapping 4 source points to 4 destination points
 */
function getPerspectiveTransform(src: Point[], dst: Point[]): number[] {
  const a: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    a.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    b.push(dx);

    a.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    b.push(dy);
  }

  // Gaussian elimination for 8x8 linear system
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) {
        maxRow = k;
      }
    }
    const tmpA = a[i]; a[i] = a[maxRow]; a[maxRow] = tmpA;
    const tmpB = b[i]; b[i] = b[maxRow]; b[maxRow] = tmpB;

    const pivot = a[i][i] || 1e-10;
    for (let j = i; j < n; j++) a[i][j] /= pivot;
    b[i] /= pivot;

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = a[k][i];
        for (let j = i; j < n; j++) {
          a[k][j] -= factor * a[i][j];
        }
        b[k] -= factor * b[i];
      }
    }
  }

  return [b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], 1];
}

/**
 * Inverts a 3x3 matrix
 */
function invert3x3(m: number[]): number[] {
  const a = m[0], b = m[1], c = m[2];
  const d = m[3], e = m[4], f = m[5];
  const g = m[6], h = m[7], i = m[8];

  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const I = a * e - b * d;

  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-10) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const invDet = 1 / det;

  return [
    A * invDet, D * invDet, G * invDet,
    B * invDet, E * invDet, H * invDet,
    C * invDet, F * invDet, I * invDet,
  ];
}

/**
 * Warp quadrilateral perspective into a straightened high-resolution rectangular scan
 */
export function warpPerspective(
  image: HTMLImageElement | HTMLCanvasElement,
  quad: Quad,
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  // Calculate optimal dimensions based on quad side lengths
  const topW = Math.hypot(quad.topRight.x - quad.topLeft.x, quad.topRight.y - quad.topLeft.y);
  const botW = Math.hypot(quad.bottomRight.x - quad.bottomLeft.x, quad.bottomRight.y - quad.bottomLeft.y);
  const leftH = Math.hypot(quad.bottomLeft.x - quad.topLeft.x, quad.bottomLeft.y - quad.topLeft.y);
  const rightH = Math.hypot(quad.bottomRight.x - quad.topRight.x, quad.bottomRight.y - quad.topRight.y);

  const outW = Math.max(100, Math.round(targetWidth || Math.max(topW, botW)));
  const outH = Math.max(100, Math.round(targetHeight || Math.max(leftH, rightH)));

  // Cap maximum dimension to 2400px to maintain snappy performance on mobile
  const maxDim = 2400;
  let finalW = outW;
  let finalH = outH;
  if (Math.max(finalW, finalH) > maxDim) {
    const ratio = maxDim / Math.max(finalW, finalH);
    finalW = Math.round(finalW * ratio);
    finalH = Math.round(finalH * ratio);
  }

  // Draw source image to source canvas
  const srcW = image instanceof HTMLImageElement ? image.naturalWidth || image.width : image.width;
  const srcH = image instanceof HTMLImageElement ? image.naturalHeight || image.height : image.height;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return srcCanvas;
  srcCtx.drawImage(image, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, srcW, srcH);
  const srcPixels = srcData.data;

  // Create destination canvas
  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = finalW;
  dstCanvas.height = finalH;
  const dstCtx = dstCanvas.getContext('2d', { willReadFrequently: true });
  if (!dstCtx) return dstCanvas;
  const dstData = dstCtx.createImageData(finalW, finalH);
  const dstPixels = dstData.data;

  const srcPoints = [quad.topLeft, quad.topRight, quad.bottomRight, quad.bottomLeft];
  const dstPoints = [
    { x: 0, y: 0 },
    { x: finalW, y: 0 },
    { x: finalW, y: finalH },
    { x: 0, y: finalH },
  ];

  // Mapping from destination pixel (dx, dy) back to source pixel (sx, sy)
  const H = getPerspectiveTransform(dstPoints, srcPoints);

  const h0 = H[0], h1 = H[1], h2 = H[2];
  const h3 = H[3], h4 = H[4], h5 = H[5];
  const h6 = H[6], h7 = H[7], h8 = H[8];

  let dstIdx = 0;
  for (let dy = 0; dy < finalH; dy++) {
    for (let dx = 0; dx < finalW; dx++) {
      const z = h6 * dx + h7 * dy + h8 || 1e-8;
      const sx = (h0 * dx + h1 * dy + h2) / z;
      const sy = (h3 * dx + h4 * dy + h5) / z;

      const isx = Math.round(sx);
      const isy = Math.round(sy);

      if (isx >= 0 && isx < srcW && isy >= 0 && isy < srcH) {
        const srcIdx = (isy * srcW + isx) * 4;
        dstPixels[dstIdx] = srcPixels[srcIdx];
        dstPixels[dstIdx + 1] = srcPixels[srcIdx + 1];
        dstPixels[dstIdx + 2] = srcPixels[srcIdx + 2];
        dstPixels[dstIdx + 3] = 255;
      } else {
        // Transparent / White padding outside bounds
        dstPixels[dstIdx] = 255;
        dstPixels[dstIdx + 1] = 255;
        dstPixels[dstIdx + 2] = 255;
        dstPixels[dstIdx + 3] = 255;
      }
      dstIdx += 4;
    }
  }

  dstCtx.putImageData(dstData, 0, 0);
  return dstCanvas;
}

/**
 * Apply photocopy, grayscale, magic color, and contrast filters
 */
export function applyDocumentFilter(
  sourceCanvas: HTMLCanvasElement,
  filter: FilterMode,
  brightness: number = 0,
  contrast: number = 0,
  threshold: number = 128
): string {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceCanvas.toDataURL('image/jpeg', 0.92);

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Factor for contrast: -50 to 50 maps to 0.5 to 2.0
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const bOffset = brightness * 1.5;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Standard perceptual luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    switch (filter) {
      case 'photocopy': {
        // High contrast B&W Photocopy:
        // Converts shadows to clean white paper and dark strokes to pure deep black
        const adjustedLum = Math.max(0, Math.min(255, lum + bOffset));
        const val = adjustedLum < threshold ? 18 : 255;
        r = val;
        g = val;
        b = val;
        break;
      }

      case 'grayscale': {
        // Clean paper grayscale with light tone compression
        let gray = lum + bOffset;
        gray = cFactor * (gray - 128) + 128;
        // Paper background whitening
        if (gray > 185) {
          gray = 185 + (gray - 185) * 1.6;
        }
        const val = Math.max(0, Math.min(255, Math.round(gray)));
        r = val;
        g = val;
        b = val;
        break;
      }

      case 'magic': {
        // Magic Color: Document color enhancer
        // Whitens yellowish background while boosting ink saturation and sharpness
        let br = cFactor * (r + bOffset - 128) + 128;
        let bg = cFactor * (g + bOffset - 128) + 128;
        let bb = cFactor * (b + bOffset - 128) + 128;

        // Paper whiten if near white
        const localLum = 0.299 * br + 0.587 * bg + 0.114 * bb;
        if (localLum > 185) {
          const boost = (localLum - 185) * 0.5;
          br += boost;
          bg += boost;
          bb += boost;
        }

        // Color saturation boost for stamps, logos, signatures
        const avg = (br + bg + bb) / 3;
        r = Math.max(0, Math.min(255, Math.round(avg + (br - avg) * 1.35)));
        g = Math.max(0, Math.min(255, Math.round(avg + (bg - avg) * 1.35)));
        b = Math.max(0, Math.min(255, Math.round(avg + (bb - avg) * 1.35)));
        break;
      }

      case 'high_contrast': {
        // Sharpened high contrast text
        let cr = cFactor * 1.3 * (r + bOffset - 128) + 128;
        let cg = cFactor * 1.3 * (g + bOffset - 128) + 128;
        let cb = cFactor * 1.3 * (b + bOffset - 128) + 128;
        r = Math.max(0, Math.min(255, Math.round(cr)));
        g = Math.max(0, Math.min(255, Math.round(cg)));
        b = Math.max(0, Math.min(255, Math.round(cb)));
        break;
      }

      case 'invert': {
        // Invert / Negative
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
        break;
      }

      case 'original':
      default: {
        // Original with user brightness/contrast sliders
        if (brightness !== 0 || contrast !== 0) {
          r = Math.max(0, Math.min(255, Math.round(cFactor * (r + bOffset - 128) + 128)));
          g = Math.max(0, Math.min(255, Math.round(cFactor * (g + bOffset - 128) + 128)));
          b = Math.max(0, Math.min(255, Math.round(cFactor * (b + bOffset - 128) + 128)));
        }
        break;
      }
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Rotate a canvas by 90, 180, or 270 degrees
 */
export function rotateCanvas(canvas: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  const rad = (degrees % 360) * (Math.PI / 180);
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));

  const newW = Math.round(canvas.width * cos + canvas.height * sin);
  const newH = Math.round(canvas.width * sin + canvas.height * cos);

  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = newW;
  rotCanvas.height = newH;
  const ctx = rotCanvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, newW, newH);

  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return rotCanvas;
}

/**
 * Creates a dual-side A4 photocopy sheet (رو و پشت کارت ملی روی یک برگه A4)
 */
export async function createDualSideIDCard(frontDataUrl: string, backDataUrl: string): Promise<string> {
  const [frontImg, backImg] = await Promise.all([
    loadImage(frontDataUrl),
    loadImage(backDataUrl),
  ]);

  // Standard A4 at 150 DPI: 1240 x 1754 px
  const a4W = 1240;
  const a4H = 1754;

  const canvas = document.createElement('canvas');
  canvas.width = a4W;
  canvas.height = a4H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return frontDataUrl;

  // Crisp white paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, a4W, a4H);

  // Subtle header watermark in Persian
  ctx.font = 'bold 22px Vazirmatn, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText('فتوکپی رسمی کارت شناسایی (روی کارت و پشت کارت)', a4W / 2, 80);

  // Standard ID Card dimension: 85.6mm x 54mm (aspect ratio 1.585)
  // On 150 DPI A4, card width is ~505px, card height is ~318px
  const cardW = 560;
  const cardH = Math.round(cardW / 1.585);

  const centerX = (a4W - cardW) / 2;

  // Front card position (Top half)
  const frontY = 220;
  // Outer dashed guide box
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(centerX - 12, frontY - 12, cardW + 24, cardH + 24);
  ctx.setLineDash([]);
  ctx.drawImage(frontImg, centerX, frontY, cardW, cardH);

  ctx.font = '16px Vazirmatn, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('◄ روی مدرک شناسایی ►', a4W / 2, frontY + cardH + 40);

  // Back card position (Bottom half)
  const backY = 880;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.strokeRect(centerX - 12, backY - 12, cardW + 24, cardH + 24);
  ctx.setLineDash([]);
  ctx.drawImage(backImg, centerX, backY, cardW, cardH);

  ctx.fillText('◄ پشت مدرک شناسایی ►', a4W / 2, backY + cardH + 40);

  // Footer stamp note
  ctx.font = '14px Vazirmatn, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('تهیه شده توسط اپلیکیشن فتوکپی پلاس - کیفیت تضمین شده چاپ', a4W / 2, a4H - 50);

  return canvas.toDataURL('image/jpeg', 0.95);
}
