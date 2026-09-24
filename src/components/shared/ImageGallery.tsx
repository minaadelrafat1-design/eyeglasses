import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn } from "lucide-react";
import { cx } from "@/lib/utils";
import type { ProductImage } from "@/types";

export interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
  className?: string;
  /** Slot for a try-on / AR entry point rendered over the main image. */
  overlay?: React.ReactNode;
}

/**
 * Product image gallery with thumbnails, hover magnifier and a fullscreen
 * lightbox. Only the active image is eagerly loaded; everything else is lazy
 * and `async`-decoded so large galleries stay cheap on mobile.
 */
export function ImageGallery({ images, productName, className, overlay }: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const ordered = [...images].sort((a, b) => a.position - b.position);
  const count = ordered.length;
  const current = ordered[active] ?? ordered[0];

  const step = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setActive((i) => (i + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    setActive(0);
  }, [productName]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, step]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  if (!current) {
    return (
      <div className={cx("aspect-square w-full rounded-2xl bg-ink-100", className)} aria-hidden />
    );
  }

  return (
    <div className={cx("flex flex-col gap-4", className)}>
      <div
        ref={frameRef}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={handleMove}
        className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-ink-100"
      >
        <img
          key={current.id}
          src={current.url}
          alt={current.altText ?? `${productName} — view ${active + 1}`}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover transition-transform duration-300 ease-[var(--ease-emphasized)]"
          style={{
            transform: zooming ? "scale(2)" : "scale(1)",
            transformOrigin: `${origin.x}% ${origin.y}%`,
          }}
        />

        <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-xs font-medium text-ink-600 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
          <ZoomIn size={14} />
          Hover to zoom
        </span>

        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Open fullscreen gallery"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink-700 backdrop-blur-md transition-colors hover:bg-white"
        >
          <Maximize2 size={16} />
        </button>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink-700 opacity-0 backdrop-blur-md transition-opacity hover:bg-white group-hover:opacity-100"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink-700 opacity-0 backdrop-blur-md transition-opacity hover:bg-white group-hover:opacity-100"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {overlay && <div className="absolute bottom-3 right-3 z-10">{overlay}</div>}
      </div>

      {count > 1 && (
        <div className="grid grid-cols-5 gap-3" role="tablist" aria-label="Product images">
          {ordered.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`View image ${index + 1}`}
              onClick={() => setActive(index)}
              className={cx(
                "overflow-hidden rounded-xl border-2 transition-all",
                index === active
                  ? "border-primary-600 ring-2 ring-primary-100"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <img
                src={image.url}
                alt={image.altText ?? `${productName} thumbnail ${index + 1}`}
                loading="lazy"
                decoding="async"
                className="aspect-square h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} gallery`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4 animate-fade-in"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            aria-label="Close gallery"
            onClick={() => setLightbox(false)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-ink-50 transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <img
            src={current.url}
            alt={current.altText ?? productName}
            decoding="async"
            className="max-h-[85vh] max-w-[92vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-ink-50 transition-colors hover:bg-white/20"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-ink-50 transition-colors hover:bg-white/20"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
