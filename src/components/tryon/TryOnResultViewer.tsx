import { useState } from 'react';
import { Download, Share2, SplitSquareHorizontal } from 'lucide-react';
import { Button } from '@/components/vui';
import { dataUrlToBlob, downloadImage } from '@/lib/imageProcessing';
import { cx } from '@/lib/utils';
import type { TryOnGenerationView } from '@/types';

export interface TryOnResultViewerProps {
  generation: TryOnGenerationView;
  className?: string;
}

/** Displays a generated try-on with compare, save and share actions. */
export function TryOnResultViewer({ generation, className }: TryOnResultViewerProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const filename = `vuera-tryon-${generation.productSlug ?? generation.productId}.png`;
  const shown = showOriginal && generation.sourceImageUrl
    ? generation.sourceImageUrl
    : generation.resultImageUrl;

  async function handleShare() {
    if (!generation.resultImageUrl) return;
    setNotice(null);
    try {
      const blob = await dataUrlToBlob(generation.resultImageUrl);
      const file = new File([blob], filename, { type: blob.type || 'image/png' });
      const shareData: ShareData = {
        files: [file],
        title: `${generation.productName} try-on`,
        text: `Here's how the ${generation.productName} frames look on me.`,
      };
      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]);
      setNotice('Image copied to your clipboard.');
    } catch {
      setNotice('Sharing is not available here — the image was saved instead.');
      downloadImage(generation.resultImageUrl, filename);
    }
  }

  if (!generation.resultImageUrl) {
    return (
      <div className={cx('rounded-2xl bg-ink-100 p-6 text-sm text-ink-600', className)}>
        This try-on image is no longer available.
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-2xl bg-ink-100">
        <img
          src={shown ?? generation.resultImageUrl}
          alt={`AI generated preview of ${generation.productName} on your face`}
          className="aspect-[4/5] w-full object-cover"
        />
        {generation.sourceImageUrl && (
          <button
            type="button"
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink-900/85 px-4 py-2 text-xs font-medium text-white backdrop-blur-md"
          >
            <SplitSquareHorizontal size={14} />
            Hold to see original
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadImage(generation.resultImageUrl!, filename)}
        >
          <Download className="h-4 w-4" />
          Save image
        </Button>
        <Button type="button" variant="outline" onClick={() => void handleShare()}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
      {notice && <p className="mt-2 text-xs text-ink-500">{notice}</p>}
    </div>
  );
}
