/**
 * Local (on-device) face analysis provider.
 *
 * Uses MediaPipe Face Landmarker to detect a 478-point face mesh directly in
 * the browser and a pure-geometry classifier to derive face shape. No image
 * data is sent anywhere — this provider requires no API key and works
 * completely offline once the model has been cached by the browser.
 */
/**
 * Local (on-device) face analysis provider.
 *
 * Uses MediaPipe Face Landmarker to detect a 478-point face mesh directly in
 * the browser and a pure-geometry classifier to derive face shape. No image
 * data is sent anywhere — this provider requires no API key and works
 * completely offline once the model has been cached by the browser.
 *
 * The browser-only detector module is imported dynamically so this file can
 * still be safely referenced from the shared provider registry without
 * pulling `document`/`Image` globals into the server bundle.
 */
import { detectFaceLandmarks, LocalFaceDetectionError } from "@/lib/ai/faceLandmarker.browser";
import { classifyFaceShape } from "./faceShapeClassifier";
import type { FaceAnalysisProvider } from "./provider";
import type { FaceAnalysis } from "@/types";

export const PROVIDER_ID = "mediapipe-local";

export const mediapipeFaceAnalysisProvider: FaceAnalysisProvider = {
  id: PROVIDER_ID,
  label: "On-device face analysis (MediaPipe)",
  async analyze(imageDataUrl: string): Promise<FaceAnalysis> {
    if (typeof window === "undefined") {
      throw new Error("On-device face analysis is only available in the browser.");
    }
    const landmarks = await detectFaceLandmarks(imageDataUrl);
    const classification = classifyFaceShape(landmarks);
    if (!classification) {
      throw new LocalFaceDetectionError(
        "Could not measure that face clearly. Try a straight-on, well-lit photo.",
        "NO_FACE",
      );
    }

    return {
      faceShape: classification.faceShape,
      confidence: classification.confidence,
      candidates: classification.candidates,
      summary: classification.summary,
      landmarks: classification.landmarks,
      provider: PROVIDER_ID,
      analyzedAt: new Date().toISOString(),
    };
  },
};
