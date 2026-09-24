import { registerFaceAnalysisProvider } from "./provider";
import { lovableFaceAnalysisProvider } from "./lovableProvider";
import { mediapipeFaceAnalysisProvider } from "./mediapipeFaceAnalysisProvider";
import { registerTryOnProvider } from "./tryOnProvider";
import { lovableTryOnProvider } from "./lovableTryOnProvider";

// Lovable AI is registered first so it's available to select explicitly, but
// the on-device MediaPipe provider is made active by default: it needs no
// API key, runs fully client-side, and never sends the customer's photo
// anywhere.
registerFaceAnalysisProvider(lovableFaceAnalysisProvider);
registerFaceAnalysisProvider(mediapipeFaceAnalysisProvider, { makeActive: true });

export type { FaceAnalysisProvider } from "./provider";
export {
  getFaceAnalysisProvider,
  listFaceAnalysisProviders,
  registerFaceAnalysisProvider,
  setActiveFaceAnalysisProvider,
} from "./provider";
export { lovableFaceAnalysisProvider } from "./lovableProvider";
export { mediapipeFaceAnalysisProvider } from "./mediapipeFaceAnalysisProvider";
export { classifyFaceShape, measureFace } from "./faceShapeClassifier";
export type { FaceMeasurements, Landmark2D } from "./faceShapeClassifier";
export {
  FACE_FRAME_AFFINITY,
  FACE_SHAPE_GUIDANCE,
  FACE_SHAPE_LABEL,
  FRAME_SHAPES,
  FRAME_SHAPE_LABEL,
  flatteringFrameShapes,
  frameAffinity,
} from "./faceShapeRules";
export { rankProducts, productColorTokens } from "./recommendationEngine";
export type { RankOptions } from "./recommendationEngine";
registerTryOnProvider(lovableTryOnProvider, { makeActive: true });

export type { TryOnProvider, TryOnRenderOutput } from "./tryOnProvider";
export {
  getTryOnProvider,
  listTryOnProviders,
  registerTryOnProvider,
  setActiveTryOnProvider,
} from "./tryOnProvider";
export { lovableTryOnProvider } from "./lovableTryOnProvider";

export type { ShoppingAssistantProvider } from "./assistantProvider";
export {
  getShoppingAssistantProvider,
  listShoppingAssistantProviders,
  registerShoppingAssistantProvider,
  setActiveShoppingAssistantProvider,
} from "./assistantProvider";
export { lovableShoppingAssistantProvider } from "./lovableAssistantProvider";
export {
  GUIDANCE,
  GUIDANCE_TOPICS,
  STARTER_PROMPTS,
  DEFAULT_SUGGESTIONS,
  guidanceFor,
} from "./assistantKnowledge";
export type { GuidanceEntry, GuidanceTopic } from "./assistantKnowledge";
