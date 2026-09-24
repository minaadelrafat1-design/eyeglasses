import { useCallback, useEffect, useState } from "react";
import { Link } from "@/lib/navigation";
import { Scan, Trash2 } from "lucide-react";
import { Button, Spinner, Modal } from "@/components/vui";
import { TryOnResultViewer } from "@/components/tryon";
import { useAuth } from "@/context";
import { fetchTryOnHistory, deleteTryOnGeneration } from "@/services/tryOnService";
import type { TryOnGenerationView } from "@/types";

export function TryOnPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<TryOnGenerationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TryOnGenerationView | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    if (!isAuthenticated) {
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchTryOnHistory()
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  const handleDelete = async (generation: TryOnGenerationView) => {
    setDeleting(true);
    try {
      await deleteTryOnGeneration(generation);
      setSelected(null);
      setHistory((prev) => prev.filter((g) => g.id !== generation.id));
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container-app py-20 md:py-28">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ink-100">
            <Scan size={36} className="text-ink-400" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">Virtual Try-On</h1>
          <p className="mt-2 text-ink-500">
            Sign in to generate AI try-on previews and keep your history saved to your account.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link to="/signin">
              <Button size="lg">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="container-app py-20 md:py-28">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ink-100">
            <Scan size={36} className="text-ink-400" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">No try-ons yet</h1>
          <p className="mt-2 text-ink-500">
            Open any frame and tap "Try On" to see it on your face with AI.
          </p>
          <Link to="/shop" className="mt-6 inline-block">
            <Button size="lg">Browse frames</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-app py-8">
          <h1 className="text-3xl font-semibold tracking-tight">Your try-ons</h1>
          <p className="mt-1 text-ink-500">
            {history.length} saved {history.length === 1 ? "result" : "results"}
          </p>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {history.map((generation) => (
            <button
              key={generation.id}
              type="button"
              onClick={() => setSelected(generation)}
              className="group text-left"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-100">
                {generation.resultImageUrl && (
                  <img
                    src={generation.resultImageUrl}
                    alt={`Try-on of ${generation.productName}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              <p className="mt-2 truncate text-sm font-medium text-ink-900">
                {generation.productName}
              </p>
              {generation.brandName && (
                <p className="truncate text-xs text-ink-500">{generation.brandName}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.productName ?? "Try-on"}
        className="max-w-xl"
      >
        {selected && (
          <div>
            <TryOnResultViewer generation={selected} />
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.productSlug && (
                <Link to={`/product/${selected.productSlug}`}>
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    View frame
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                disabled={deleting}
                onClick={() => void handleDelete(selected)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
