import { useState } from "react";
import { Link } from "@/lib/navigation";
import { Scan, Sparkles } from "lucide-react";
import { Badge, Button, Card } from "@/components/vui";
import { RatingStars } from "@/components/shared";
import { TryOnModal } from "@/components/tryon";
import { featureFlags } from "@/lib/featureFlags";
import { formatMoney } from "@/lib/utils";
import type { GlassesRecommendation } from "@/types";

export interface RecommendationCardProps {
  recommendation: GlassesRecommendation;
  rank: number;
}

export function RecommendationCard({ recommendation, rank }: RecommendationCardProps) {
  const { product, score, explanation, factors } = recommendation;
  const image = product.images[0];
  const [tryOnOpen, setTryOnOpen] = useState(false);

  return (
    <Card as="article" className="flex flex-col">
      <Link to={`/product/${product.slug}`} className="block overflow-hidden bg-ink-100">
        <div className="relative aspect-square">
          {image && (
            <img
              src={image.url}
              alt={image.altText ?? product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <Badge variant="primary" className="absolute left-3 top-3">
            #{rank} match · {Math.round(score * 100)}%
          </Badge>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-500">{product.brandName}</p>
            <h3 className="mt-1 font-medium text-ink-900">
              <Link to={`/product/${product.slug}`}>{product.name}</Link>
            </h3>
          </div>
          <p className="font-medium text-ink-900">{formatMoney(product.priceCents)}</p>
        </div>

        {product.rating !== null && (
          <div className="mt-2">
            <RatingStars rating={product.rating} count={product.reviewCount} />
          </div>
        )}

        <div className="mt-4 rounded-xl bg-ink-50 p-4">
          <p className="flex items-start gap-2 text-sm text-ink-700">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <span>{explanation}</span>
          </p>
          <ul className="mt-3 space-y-1.5">
            {factors.slice(0, 3).map((factor) => (
              <li key={factor.kind} className="flex items-center gap-2 text-xs text-ink-600">
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-200">
                  <span
                    className="block h-full rounded-full bg-primary-500"
                    style={{ width: `${Math.round(factor.weight * 100)}%` }}
                  />
                </span>
                <span>{factor.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex gap-2">
          <Link to={`/product/${product.slug}`} className="flex-1">
            <Button variant="primary" size="sm" fullWidth>
              View frame
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            disabled={!featureFlags.virtualTryOn}
            title={featureFlags.virtualTryOn ? "Try this frame on" : "AR try-on is coming soon"}
            onClick={() => setTryOnOpen(true)}
          >
            <Scan className="h-4 w-4" />
            Try on
          </Button>
        </div>
      </div>

      {featureFlags.virtualTryOn && (
        <TryOnModal
          open={tryOnOpen}
          onClose={() => setTryOnOpen(false)}
          product={product}
          variant={product.variants[0] ?? null}
        />
      )}
    </Card>
  );
}
