import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/vui';
import { captureVideoFrame, compressImageFile, MAX_UPLOAD_BYTES } from '@/lib/imageProcessing';
import { cx } from '@/lib/utils';

export interface PhotoCaptureProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

/** Upload-or-camera photo picker used by the AI try-on flow. */
export function PhotoCapture({ value, onChange, disabled = false }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError('Camera access was blocked. Upload a photo instead.');
    }
  }, []);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setError(null);
      if (!file.type.startsWith('image/')) {
        setError('Please choose an image file.');
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setError('That image is too large. Try a photo under 10 MB.');
        return;
      }
      try {
        stopCamera();
        onChange(await compressImageFile(file));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not read that image.');
      }
    },
    [onChange, stopCamera],
  );

  const shoot = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const frame = captureVideoFrame(video);
    if (!frame) {
      setError('Could not capture that frame. Try again.');
      return;
    }
    stopCamera();
    onChange(frame);
  }, [onChange, stopCamera]);

  if (value) {
    return (
      <div>
        <div className="relative overflow-hidden rounded-2xl bg-ink-100">
          <img src={value} alt="Your photo" className="aspect-[4/5] w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label="Remove photo"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink-700 backdrop-blur-md transition-colors hover:bg-white hover:text-ink-900 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3"
          disabled={disabled}
          onClick={() => onChange(null)}
        >
          <RefreshCw className="h-4 w-4" />
          Use a different photo
        </Button>
      </div>
    );
  }

  return (
    <div>
      {cameraOn ? (
        <div className="overflow-hidden rounded-2xl bg-ink-950">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-[4/5] w-full scale-x-[-1] object-cover"
          />
          <div className="flex gap-2 p-3">
            <Button type="button" fullWidth onClick={shoot} disabled={disabled}>
              <Camera className="h-4 w-4" />
              Take photo
            </Button>
            <Button type="button" variant="outline" onClick={stopCamera}>
              Cancel
            </Button>
          </div>
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
          <p className="mt-4 text-sm font-medium text-ink-800">Add your photo</p>
          <p className="mt-1.5 text-sm text-ink-500">
            Face the camera straight on in even light, hair back and no glasses.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              Upload photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => void startCamera()}
            >
              <Camera className="h-4 w-4" />
              Use camera
            </Button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
    </div>
  );
}
