/**
 * Client-only MediaPipe Face Landmarker loader.
 *
 * Runs entirely in the browser: the WASM runtime and the face-mesh model
 * weights are fetched once from MediaPipe's public CDN and cached by the
 * browser, but the customer's photo itself never leaves the device — it is
 * decoded into a canvas and passed straight into the on-device model.
 *
 * Must only be imported/executed client-side (guarded by callers checking
 * `typeof window !== 'undefined'`); it touches `document`/`Image` directly.
 */
import type { FaceLandmarker as FaceLandmarkerType } from "@mediapipe/tasks-vision";
import type { Landmark2D } from "@/services/ai/faceShapeClassifier";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise: Promise<FaceLandmarkerType> | null = null;

async function loadLandmarker(): Promise<FaceLandmarkerType> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
      });
    })().catch((error: unknown) => {
      // Allow a retry on the next call instead of caching a permanent failure.
      landmarkerPromise = null;
      throw error;
    });
  }
  return landmarkerPromise;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That photo could not be read."));
    image.src = dataUrl;
  });
}

export class LocalFaceDetectionError extends Error {
  readonly code: "NO_FACE" | "LOAD_FAILED" | "UNSUPPORTED";
  constructor(message: string, code: "NO_FACE" | "LOAD_FAILED" | "UNSUPPORTED") {
    super(message);
    this.name = "LocalFaceDetectionError";
    this.code = code;
  }
}

/** Detect the primary face's 478 mesh landmarks in an image data URL, entirely on-device. */
export async function detectFaceLandmarks(imageDataUrl: string): Promise<Landmark2D[]> {
  if (typeof window === "undefined") {
    throw new LocalFaceDetectionError(
      "Local face detection is only available in the browser.",
      "UNSUPPORTED",
    );
  }

  let landmarker: FaceLandmarkerType;
  try {
    landmarker = await loadLandmarker();
  } catch {
    throw new LocalFaceDetectionError(
      "Could not load the on-device face model. Check your connection and try again.",
      "LOAD_FAILED",
    );
  }

  const image = await loadImage(imageDataUrl);
  const result = landmarker.detect(image);
  const face = result.faceLandmarks[0];
  if (!face || face.length === 0) {
    throw new LocalFaceDetectionError(
      "No face was detected in that photo. Try a clearer, front-facing shot.",
      "NO_FACE",
    );
  }
  return face.map((point) => ({ x: point.x, y: point.y }));
}
