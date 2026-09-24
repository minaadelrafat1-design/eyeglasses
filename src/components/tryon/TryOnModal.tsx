import { useCallback, useEffect, useState } from "react";
import { Link } from "@/lib/navigation";
import { Sparkles } from "lucide-react";
import { Button, Modal } from "@/components/vui";
import { PhotoCapture } from "./PhotoCapture";
import { TryOnLoader } from "./TryOnLoader";
import { TryOnResultViewer } from "./TryOnResultViewer";
import { useAuth } from "@/context";
import { buildTryOnInput, generateTryOnImage } from "@/services/tryOnService";
import type { Product, ProductVariant, TryOnGenerationView } from "@/types";

export interface TryOnModalProps {
  open: boolean;
  onClose: () => void;
  product: Product;
  variant?: ProductVariant | null;
}

/** Full AI try-on flow: photo → generation → result, saved to history. */
export function TryOnModal({ open, onClose, product, variant }: TryOnModalProps) {
  const { isAuthenticated } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<TryOnGenerationView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhoto(null);
      setResult(null);
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const run = useCallback(async () => {
    if (!photo) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await generateTryOnImage(buildTryOnInput(product, photo, variant)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The try-on could not be generated.");
    } finally {
      setBusy(false);
    }
  }, [photo, product, variant]);

  return (
    <Modal open={open} onClose={onClose} title={`AI Try On · ${product.name}`} className="max-w-xl">
      {!isAuthenticated ? (
        <div className="text-sm text-ink-600">
          <p>Sign in to generate a try-on and keep your results in your account.</p>
          <div className="mt-4 flex gap-2">
            <Link to="/signin">
              <Button onClick={onClose}>Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" onClick={onClose}>
                Create account
              </Button>
            </Link>
          </div>
        </div>
      ) : busy ? (
        <TryOnLoader step={2} />
      ) : result ? (
        <div>
          <TryOnResultViewer generation={result} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setResult(null);
                setPhoto(null);
              }}
            >
              Try another photo
            </Button>
            <Link to="/try-on">
              <Button variant="ghost" onClick={onClose}>
                View my try-ons
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <PhotoCapture value={photo} onChange={setPhoto} disabled={busy} />
          {error && (
            <div className="mt-3 rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700">
              <p>{error}</p>
              {photo && (
                <button
                  type="button"
                  onClick={() => void run()}
                  className="mt-2 font-medium underline underline-offset-2 hover:no-underline"
                >
                  Try again
                </button>
              )}
            </div>
          )}
          <Button className="mt-4" fullWidth disabled={!photo} onClick={() => void run()}>
            <Sparkles className="h-4 w-4" />
            {error ? "Retry generation" : "Generate try-on"}
          </Button>
          <p className="mt-3 text-xs text-ink-500">
            Your photo and result are stored privately in your account and only visible to you.
          </p>
        </div>
      )}
    </Modal>
  );
}
