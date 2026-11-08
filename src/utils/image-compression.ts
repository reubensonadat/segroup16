/**
 * Client-Side Image Compression & WebP Optimization Engine
 *
 * Compresses uploaded images (PNG, JPG, HEIC, etc.) client-side into modern WebP
 * format before storing or sending to the runway.
 *
 * Benefits:
 * - Ultra-low file sizes for instant mobile loading in Accra/Ghanaian cellular networks.
 * - Full Alpha Transparency preservation for cutout PNGs (shoes, tech, bags, watches).
 * - Max dimension constraints while maintaining aspect ratio and sharpness.
 * - Fallback safety for non-browser / test environments.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0, default 0.85
  targetFormat?: 'image/webp' | 'image/jpeg' | 'image/png';
}

export interface CompressedImageResult {
  dataUrl: string;
  originalSize: number; // bytes
  compressedSize: number; // bytes
  savedBytes: number;
  savedPercent: number; // 0 to 100
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Format bytes into human-readable string (e.g. "1.2 MB", "185 KB")
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / Math.pow(1024, i);
  const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
  return `${formatted} ${units[i]}`;
}

/**
 * Compresses any File, Blob, or image data URL to an optimized WebP data URL.
 * Automatically preserves alpha transparency for PNG cutouts.
 */
export async function compressImageToWebp(
  source: File | Blob | string,
  options: ImageCompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1600,
    maxHeight = 2400,
    quality = 0.85,
    targetFormat = 'image/webp',
  } = options;

  // Determine original byte size
  let originalSize = 0;
  if (typeof source === 'string') {
    // Data URL approximation
    const base64Index = source.indexOf(';base64,');
    if (base64Index > -1) {
      const b64 = source.substring(base64Index + 8);
      originalSize = Math.round((b64.length * 3) / 4);
    } else {
      originalSize = source.length;
    }
  } else {
    originalSize = source.size;
  }

  // Graceful fallback for non-DOM / test environments
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const dummyUrl = typeof source === 'string' ? source : 'data:image/webp;base64,';
    return {
      dataUrl: dummyUrl,
      originalSize,
      compressedSize: originalSize,
      savedBytes: 0,
      savedPercent: 0,
      width: 800,
      height: 1200,
      mimeType: targetFormat,
    };
  }

  // Convert source to image URL
  let objectUrlToRevoke: string | null = null;
  let srcUrl: string;

  if (typeof source === 'string') {
    srcUrl = source;
  } else {
    objectUrlToRevoke = URL.createObjectURL(source);
    srcUrl = objectUrlToRevoke;
  }

  try {
    const img = await loadImage(srcUrl);

    // Calculate constrained dimensions
    let { width, height } = img;
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Render to canvas with alpha channel support
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });

    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    // Export to WebP
    let mime = targetFormat;
    let dataUrl = canvas.toDataURL(mime, quality);

    // Check if the browser actually returned WebP
    if (!dataUrl.startsWith('data:image/webp')) {
      // Fallback: If WebP export is not supported, export to PNG to retain alpha
      dataUrl = canvas.toDataURL('image/png');
      mime = 'image/png';
    }

    // Calculate compressed size
    const b64 = dataUrl.substring(dataUrl.indexOf(';base64,') + 8);
    const compressedSize = Math.round((b64.length * 3) / 4);
    const savedBytes = Math.max(0, originalSize - compressedSize);
    const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

    return {
      dataUrl,
      originalSize,
      compressedSize,
      savedBytes,
      savedPercent,
      width,
      height,
      mimeType: mime,
    };
  } finally {
    if (objectUrlToRevoke) {
      URL.revokeObjectURL(objectUrlToRevoke);
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image for compression'));
    img.src = src;
  });
}

