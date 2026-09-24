/**
 * Browser-side image helpers shared by the AI features. Keeping photos small
 * before upload protects request limits, storage size and generation latency.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_EDGE = 1024;
const DEFAULT_QUALITY = 0.85;

export interface CompressOptions {
  maxEdge?: number;
  quality?: number;
}

function drawToDataUrl(
  image: HTMLImageElement | HTMLVideoElement,
  width: number,
  height: number,
  { maxEdge = DEFAULT_MAX_EDGE, quality = DEFAULT_QUALITY }: CompressOptions = {},
): string | null {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

/** Read a file and downscale it to a JPEG data URL. */
export function compressImageFile(file: File, options?: CompressOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const source = String(reader.result);
      const image = new Image();
      image.onerror = () => reject(new Error('That file is not a valid image.'));
      image.onload = () => {
        resolve(drawToDataUrl(image, image.width, image.height, options) ?? source);
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

/** Grab the current video frame as a downscaled JPEG data URL. */
export function captureVideoFrame(
  video: HTMLVideoElement,
  options?: CompressOptions,
): string | null {
  return drawToDataUrl(video, video.videoWidth, video.videoHeight, options);
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export function downloadImage(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
