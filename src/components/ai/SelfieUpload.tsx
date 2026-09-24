import { useCallback, useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/vui';
import { cx } from '@/lib/utils';

export interface SelfieUploadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

const MAX_BYTES = 6 * 1024 * 1024;
const MAX_EDGE = 900;

/** Downscale in the browser so large phone photos stay inside request limits. */
function readAndCompress(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.onload = () => {
      const source = String(reader.result);
      const image = new Image();
      image.onerror = () => reject(new Error('That file is not a valid image.'));
      image.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(source);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

export function SelfieUpload({ value, onChange, disabled = false }: SelfieUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setError(null);
      if (!file.type.startsWith('image/')) {
        setError('Please choose an image file.');
        return;
      }
      if (file.size > MAX_BYTES) {
        setError('That image is larger than 6 MB. Try a smaller photo.');
        return;
      }
      try {
        onChange(await readAndCompress(file));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not read that image.');
      }
    },
    [onChange],
  );

  return (
    <div>
      {value ? (
        <div className="relative overflow-hidden rounded-2xl bg-ink-100">
          <img src={value} alt="Your uploaded selfie" className="aspect-[4/5] w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label="Remove photo"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink-700 backdrop-blur-md transition-colors hover:bg-white hover:text-ink-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void handleFile(event.dataTransfer.files[0]);
          }}
          className={cx(
            'flex aspect-[4/5] flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center transition-colors',
            dragging ? 'border-primary-500 bg-primary-50' : 'border-ink-300 bg-ink-50',
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink-600 shadow-sm">
            <Camera className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm font-medium text-ink-800">Upload a selfie</p>
          <p className="mt-1.5 text-sm text-ink-500">
            Face the camera straight on, hair back, no glasses. Drag a photo here or browse.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-5"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            Choose photo
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          void handleFile(file).finally(() => {
            input.value = '';
          });
        }}
      />

      {error && <p className="mt-3 text-sm text-error-600">{error}</p>}
      <p className="mt-3 text-xs text-ink-500">
        Your photo is analysed for face shape only and is never stored.
      </p>
    </div>
  );
}