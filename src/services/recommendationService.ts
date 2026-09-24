/**
 * Glasses recommendation orchestration.
 *
 * Combines the AI provider (face analysis) with the catalog service and the
 * scoring engine. Call sites pass raw customer input and get a fully explained
 * result back — no vendor or model details leak into the UI.
 */
import { fetchProducts, fetchSizes } from "./productService";
import { getFaceAnalysisProvider, flatteringFrameShapes, rankProducts } from "./ai";
import { FACE_SHAPE_GUIDANCE } from "./ai/faceShapeRules";
import { ApiError } from "@/types";
import type { FaceAnalysis, RecommendationInput, RecommendationOutcome } from "@/types";

const CANDIDATE_PAGE_SIZE = 100;

function manualAnalysis(input: RecommendationInput): FaceAnalysis {
  const shape = input.manualFaceShape!;
  return {
    faceShape: shape,
    confidence: 1,
    candidates: [{ shape, confidence: 1 }],
    summary: "Face shape selected manually.",
    landmarks: null,
    provider: "manual",
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Remember the detected face shape for this browser so other AI surfaces (the
 * chat advisor, and later the AR try-on pipeline) can pick up where the
 * customer left off. Only the shape token is stored — never the selfie.
 */
export const FACE_SHAPE_STORAGE_KEY = "vuera.face-shape";

function rememberFaceShape(analysis: FaceAnalysis): FaceAnalysis {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(FACE_SHAPE_STORAGE_KEY, analysis.faceShape);
    } catch {
      // non-fatal
    }
  }
  return analysis;
}

export async function analyzeCustomerFace(input: RecommendationInput): Promise<FaceAnalysis> {
  if (input.imageDataUrl) {
    return rememberFaceShape(await getFaceAnalysisProvider().analyze(input.imageDataUrl));
  }
  if (input.manualFaceShape) return rememberFaceShape(manualAnalysis(input));
  throw new ApiError("Upload a selfie or choose your face shape to continue.", 400, "NO_INPUT");
}

export async function getGlassesRecommendations(
  input: RecommendationInput,
  options: { limit?: number } = {},
): Promise<RecommendationOutcome> {
  const analysis = await analyzeCustomerFace(input);

  const [catalog, sizes] = await Promise.all([
    fetchProducts({ pageSize: CANDIDATE_PAGE_SIZE }),
    fetchSizes().catch(() => []),
  ]);
  if (catalog.items.length === 0) {
    throw new ApiError("No frames are available to recommend right now.", 503, "EMPTY_CATALOG");
  }

  const recommendations = rankProducts(catalog.items, {
    faceShape: analysis.faceShape,
    faceLandmarks: analysis.landmarks,
    sizes,
    preferences: input.preferences,
    browsing: input.browsing,
    ...(options.limit !== undefined ? { limit: options.limit } : {}),
  });

  return {
    analysis,
    recommendations,
    suggestedFrameShapes: flatteringFrameShapes(analysis.faceShape),
    guidance: FACE_SHAPE_GUIDANCE[analysis.faceShape],
  };
}
