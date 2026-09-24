/**
 * AI recommendation domain types.
 *
 * These describe the contract between the UI, the AI service layer and any
 * concrete AI provider (Lovable AI today, a bespoke vision API tomorrow).
 * Nothing here depends on a specific vendor.
 */
import type { FrameShape, Money, Product, UUID } from "./domain";

export type FaceShape = "oval" | "round" | "square" | "heart" | "diamond" | "rectangle";

export const FACE_SHAPES: FaceShape[] = [
  "oval",
  "round",
  "square",
  "heart",
  "diamond",
  "rectangle",
];

export interface FaceShapeScore {
  shape: FaceShape;
  /** 0–1 likelihood reported by the analyzer. */
  confidence: number;
}

/** Result of analysing a selfie. Vendor agnostic. */
export interface FaceAnalysis {
  /** Most likely face shape. */
  faceShape: FaceShape;
  confidence: number;
  /** Ranked alternatives, including the primary shape. */
  candidates: FaceShapeScore[];
  /** Short human-readable description of the facial proportions observed. */
  summary: string;
  /** Optional measurement hints for a future AR try-on pipeline. */
  landmarks: FaceLandmarkHints | null;
  /** Identifier of the provider that produced the analysis. */
  provider: string;
  analyzedAt: string;
}

/** Loose, normalised (0–1) hints reserved for AR try-on alignment. */
export interface FaceLandmarkHints {
  faceWidthRatio: number | null;
  faceLengthRatio: number | null;
  jawWidthRatio: number | null;
  foreheadWidthRatio: number | null;
}

export interface StylePreferences {
  /** Preferred frame shapes, empty means "no preference". */
  frameShapes: FrameShape[];
  /** Preferred colour tokens, e.g. "black", "tortoise". */
  colors: string[];
  minPriceCents: Money;
  maxPriceCents: Money;
  /** Free-text style note passed to the AI provider. */
  notes: string;
}

/** Browsing signal collected client-side (recently viewed product ids). */
export interface BrowsingSignal {
  recentlyViewedProductIds: UUID[];
  wishlistProductIds: UUID[];
}

export interface RecommendationInput {
  imageDataUrl: string | null;
  /** Manually chosen face shape when the customer skips the selfie. */
  manualFaceShape: FaceShape | null;
  preferences: StylePreferences;
  browsing: BrowsingSignal;
}

export type RecommendationFactorKind =
  "face-shape" | "frame-shape" | "size" | "color" | "budget" | "browsing" | "popularity";

export interface RecommendationFactor {
  kind: RecommendationFactorKind;
  /** Contribution to the final score, 0–1 scale before weighting. */
  weight: number;
  label: string;
}

export interface GlassesRecommendation {
  product: Product;
  /** Normalised 0–1 match score. */
  score: number;
  /** Customer-facing sentence explaining the match. */
  explanation: string;
  factors: RecommendationFactor[];
}

export interface RecommendationOutcome {
  analysis: FaceAnalysis;
  recommendations: GlassesRecommendation[];
  /** Frame shapes considered flattering for the detected face shape. */
  suggestedFrameShapes: FrameShape[];
  /** Overall styling guidance for the detected face shape. */
  guidance: string;
}
