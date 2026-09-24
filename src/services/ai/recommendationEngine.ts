/**
 * Recommendation scoring engine.
 *
 * Pure functions over catalog products — nothing is hardcoded per product.
 * Each signal (face shape, frame preference, colour, budget, browsing history,
 * popularity) contributes a weighted factor, and the winning factors are turned
 * into a customer-facing explanation.
 */
import type {
  BrowsingSignal,
  FaceLandmarkHints,
  FaceShape,
  GlassesRecommendation,
  Product,
  RecommendationFactor,
  SizeOption,
  StylePreferences,
} from "@/types";
import { FACE_SHAPE_LABEL, FRAME_SHAPE_LABEL, frameAffinity } from "./faceShapeRules";

const WEIGHTS = {
  "face-shape": 0.34,
  "frame-shape": 0.16,
  size: 0.12,
  color: 0.12,
  budget: 0.1,
  browsing: 0.1,
  popularity: 0.06,
} as const;

/** Colour tokens are encoded in variant names ("Matte Black / 52mm"). */
export function productColorTokens(product: Product): string[] {
  return product.variants.map((variant) =>
    (variant.name.split("/")[0] ?? variant.name).trim().toLowerCase(),
  );
}

function colorScore(product: Product, preferred: string[]): number | null {
  if (preferred.length === 0) return null;
  const tokens = productColorTokens(product);
  const hit = preferred.some((pref) =>
    tokens.some(
      (token) => token.includes(pref.toLowerCase()) || pref.toLowerCase().includes(token),
    ),
  );
  return hit ? 1 : 0.15;
}

function budgetScore(product: Product, prefs: StylePreferences): number {
  const { minPriceCents, maxPriceCents } = prefs;
  const price = product.priceCents;
  if (price >= minPriceCents && price <= maxPriceCents) return 1;
  const distance = price < minPriceCents ? minPriceCents - price : price - maxPriceCents;
  const span = Math.max(maxPriceCents - minPriceCents, 5000);
  return Math.max(0, 1 - distance / span);
}

function browsingScore(
  product: Product,
  browsing: BrowsingSignal,
  catalog: Product[],
): number | null {
  const seenIds = [...browsing.recentlyViewedProductIds, ...browsing.wishlistProductIds];
  if (seenIds.length === 0) return null;

  const seen = catalog.filter((item) => seenIds.includes(item.id));
  if (seen.length === 0) return null;

  const shapes = new Set(seen.map((item) => item.shape).filter(Boolean));
  const brands = new Set(seen.map((item) => item.brandName).filter(Boolean));
  const materials = new Set(seen.map((item) => item.material).filter(Boolean));
  const avgPrice = seen.reduce((sum, item) => sum + item.priceCents, 0) / seen.length;

  let score = 0;
  if (product.shape && shapes.has(product.shape)) score += 0.4;
  if (product.brandName && brands.has(product.brandName)) score += 0.25;
  if (product.material && materials.has(product.material)) score += 0.15;
  const priceGap = Math.abs(product.priceCents - avgPrice) / Math.max(avgPrice, 1);
  score += Math.max(0, 0.2 * (1 - priceGap));

  return Math.min(1, score);
}

function popularityScore(product: Product): number {
  const rating = product.rating ?? 3.5;
  const volume = Math.min(1, product.reviewCount / 200);
  return Math.min(1, (rating / 5) * 0.75 + volume * 0.25);
}

/**
 * Approximate a target lens width (mm) from on-device face measurements.
 *
 * A 2D photo has no physical scale reference, so this is a proportional
 * heuristic — not a calibrated measurement — mapping how broad the jaw and
 * forehead are relative to the cheekbones onto the typical adult eyewear
 * range (~46–58mm). It nudges size-appropriate variants upward; it never
 * blocks a product outright.
 */
function targetLensWidthMm(hints: FaceLandmarkHints): number {
  const breadth = (hints.jawWidthRatio ?? 0.85) + (hints.foreheadWidthRatio ?? 0.85);
  const normalized = clamp01((breadth / 2 - 0.7) / (1.0 - 0.7));
  return 46 + normalized * (58 - 46);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

function sizeScore(
  product: Product,
  faceLandmarks: FaceLandmarkHints | null,
  sizeById: Map<string, number>,
): number | null {
  if (!faceLandmarks) return null;
  const variantSizesMm = product.variants
    .map((variant) => (variant.sizeId ? sizeById.get(variant.sizeId) : undefined))
    .filter((mm): mm is number => typeof mm === "number");
  if (variantSizesMm.length === 0) return null;

  const target = targetLensWidthMm(faceLandmarks);
  const closestGapMm = Math.min(...variantSizesMm.map((mm) => Math.abs(mm - target)));
  // Full credit within 2mm of target, tapering to 0 by 10mm away.
  return clamp01(1 - Math.max(0, closestGapMm - 2) / 8);
}

function buildExplanation(
  product: Product,
  faceShape: FaceShape,
  factors: RecommendationFactor[],
): string {
  const frameLabel = product.shape ? FRAME_SHAPE_LABEL[product.shape].toLowerCase() : "these";
  const lead = `Your face shape appears ${FACE_SHAPE_LABEL[faceShape].toLowerCase()}. These ${frameLabel} frames may complement your features.`;

  const supporting = factors
    .filter((factor) => factor.kind !== "face-shape" && factor.weight >= 0.6)
    .slice(0, 2)
    .map((factor) => factor.label);

  return supporting.length > 0 ? `${lead} ${supporting.join(" ")}` : lead;
}

export interface RankOptions {
  faceShape: FaceShape;
  /** Measurement hints from the analyzer, used for size-fit scoring. */
  faceLandmarks?: FaceLandmarkHints | null;
  /** Catalog size options, keyed by id, resolved from `fetchSizes()`. */
  sizes?: SizeOption[];
  preferences: StylePreferences;
  browsing: BrowsingSignal;
  limit?: number;
}

export function rankProducts(catalog: Product[], options: RankOptions): GlassesRecommendation[] {
  const { faceShape, faceLandmarks = null, sizes = [], preferences, browsing, limit = 6 } = options;
  const sizeById = new Map(sizes.map((size) => [size.id, size.sizeMm]));

  const scored = catalog
    .filter((product) => product.status === "active" && product.images.length > 0)
    .map((product) => {
      const factors: RecommendationFactor[] = [];
      let total = 0;
      let weightUsed = 0;

      const add = (kind: RecommendationFactor["kind"], value: number, label: string) => {
        const weight = WEIGHTS[kind];
        factors.push({ kind, weight: value, label });
        total += value * weight;
        weightUsed += weight;
      };

      const affinity = frameAffinity(faceShape, product.shape);
      add(
        "face-shape",
        affinity,
        product.shape
          ? `${FRAME_SHAPE_LABEL[product.shape]} frames balance ${/^[aeiou]/i.test(FACE_SHAPE_LABEL[faceShape]) ? "an" : "a"} ${FACE_SHAPE_LABEL[faceShape].toLowerCase()} face.`
          : "A versatile silhouette that suits most proportions.",
      );

      if (preferences.frameShapes.length > 0) {
        const match = product.shape !== null && preferences.frameShapes.includes(product.shape);
        add(
          "frame-shape",
          match ? 1 : 0.2,
          match
            ? "It matches the frame shape you asked for."
            : "A close alternative to your chosen shape.",
        );
      }

      const fitScore = sizeScore(product, faceLandmarks, sizeById);
      if (fitScore !== null) {
        add(
          "size",
          fitScore,
          fitScore >= 0.75
            ? "Its available size fits your face width well."
            : "A size close to your face width is available.",
        );
      }

      const colour = colorScore(product, preferences.colors);
      if (colour !== null) {
        add(
          "color",
          colour,
          colour === 1
            ? "It comes in the colours you prefer."
            : "The colourway sits close to your palette.",
        );
      }

      add("budget", budgetScore(product, preferences), "The price sits inside your budget range.");

      const browsed = browsingScore(product, browsing, catalog);
      if (browsed !== null) {
        add("browsing", browsed, "It echoes the frames you have been browsing.");
      }

      add("popularity", popularityScore(product), "Highly rated by other customers.");

      const score = weightUsed > 0 ? total / weightUsed : 0;
      const ordered = [...factors].sort((a, b) => b.weight - a.weight);

      return {
        product,
        score,
        factors: ordered,
        explanation: buildExplanation(product, faceShape, ordered),
      } satisfies GlassesRecommendation;
    });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
