/**
 * Face shape classification from MediaPipe face-mesh landmarks.
 *
 * Pure geometry — no network calls, no vendor dependency. Takes the 478
 * normalized landmarks produced by `FaceLandmarker` and derives the same
 * four measurement ratios the rest of the app already expects
 * (`FaceLandmarkHints`), then applies rule-based thresholds to classify the
 * face into one of the six supported shapes with a confidence score.
 */
import { FACE_SHAPES, type FaceLandmarkHints, type FaceShape, type FaceShapeScore } from "@/types";

/** Minimal shape of a MediaPipe NormalizedLandmark — avoids a hard package dependency here. */
export interface Landmark2D {
  x: number;
  y: number;
}

/**
 * MediaPipe's 478-point face mesh landmark indices used for the
 * measurements below. These indices are fixed by the model topology.
 */
const LANDMARKS = {
  faceTop: 10,
  chin: 152,
  leftCheek: 234,
  rightCheek: 454,
  leftJaw: 172,
  rightJaw: 397,
  leftForehead: 21,
  rightForehead: 251,
  leftTemple: 127,
  rightTemple: 356,
} as const;

function distance(a: Landmark2D, b: Landmark2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export interface FaceMeasurements {
  /** Face length (hairline-adjacent top to chin) vs cheekbone width. */
  faceLengthRatio: number;
  /** Cheekbone width relative to itself — always 1, kept for symmetry with hints. */
  faceWidthRatio: number;
  /** Jaw width relative to cheekbone width. */
  jawWidthRatio: number;
  /** Forehead width relative to cheekbone width. */
  foreheadWidthRatio: number;
}

/** Derive the four normalized measurement ratios from raw landmarks. */
export function measureFace(landmarks: Landmark2D[]): FaceMeasurements | null {
  const get = (index: number): Landmark2D | undefined => landmarks[index];
  const top = get(LANDMARKS.faceTop);
  const chin = get(LANDMARKS.chin);
  const cheekL = get(LANDMARKS.leftCheek);
  const cheekR = get(LANDMARKS.rightCheek);
  const jawL = get(LANDMARKS.leftJaw);
  const jawR = get(LANDMARKS.rightJaw);
  const foreheadL = get(LANDMARKS.leftForehead) ?? get(LANDMARKS.leftTemple);
  const foreheadR = get(LANDMARKS.rightForehead) ?? get(LANDMARKS.rightTemple);

  if (!top || !chin || !cheekL || !cheekR || !jawL || !jawR || !foreheadL || !foreheadR) {
    return null;
  }

  const faceLength = distance(top, chin);
  const cheekWidth = distance(cheekL, cheekR);
  const jawWidth = distance(jawL, jawR);
  const foreheadWidth = distance(foreheadL, foreheadR);

  if (cheekWidth <= 0 || faceLength <= 0) return null;

  return {
    faceLengthRatio: faceLength / cheekWidth,
    faceWidthRatio: 1,
    jawWidthRatio: jawWidth / cheekWidth,
    foreheadWidthRatio: foreheadWidth / cheekWidth,
  };
}

/**
 * Rule-based face shape classification from measurement ratios.
 *
 * Thresholds are informed by common optician / styling heuristics:
 *  - length/width close to 1 with soft jaw → round; longer → oval or rectangle
 *  - jaw and forehead close in width to cheekbones with a longer face → square/rectangle
 *  - forehead noticeably wider than jaw → heart
 *  - cheekbones noticeably wider than both forehead and jaw → diamond
 */
function scoreShapes(m: FaceMeasurements): FaceShapeScore[] {
  const { faceLengthRatio: length, jawWidthRatio: jaw, foreheadWidthRatio: forehead } = m;

  const scores: Record<FaceShape, number> = {
    oval: 0,
    round: 0,
    square: 0,
    heart: 0,
    diamond: 0,
    rectangle: 0,
  };

  // Elongation: how much longer the face is than it is wide.
  const elongation = length - 1.35; // ~1.35 is a typical oval baseline
  // Jaw/forehead balance relative to cheekbone width.
  const jawForeheadGap = forehead - jaw;
  const angularity = 1 - Math.abs(jaw - 0.9); // jaw close to cheek width => angular/square
  const cheekProminence = 1 - Math.max(jaw, forehead); // cheeks much wider than both => diamond

  scores.oval = clamp01(0.7 - Math.abs(elongation) * 1.2 - Math.abs(jawForeheadGap) * 0.6);
  scores.round = clamp01(0.75 - Math.abs(length - 1.0) * 1.3 - angularity * 0.4);
  scores.square = clamp01(
    angularity * 0.9 - Math.max(0, elongation) * 0.8 - Math.abs(jawForeheadGap) * 0.5,
  );
  scores.rectangle = clamp01(
    angularity * 0.7 + Math.max(0, elongation) * 0.9 - Math.abs(jawForeheadGap) * 0.5,
  );
  scores.heart = clamp01(jawForeheadGap * 1.8 - Math.max(0, elongation) * 0.3);
  scores.diamond = clamp01(cheekProminence * 1.6 - Math.abs(elongation) * 0.4);

  const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
  const normalized =
    total > 0
      ? (Object.fromEntries(
          Object.entries(scores).map(([shape, value]) => [shape, value / total]),
        ) as Record<FaceShape, number>)
      : scores;

  return FACE_SHAPES.map((shape) => ({ shape, confidence: normalized[shape] })).sort(
    (a, b) => b.confidence - a.confidence,
  );
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function summarize(shape: FaceShape, m: FaceMeasurements): string {
  const lengthDesc =
    m.faceLengthRatio > 1.3 ? "a longer" : m.faceLengthRatio < 1.05 ? "a compact" : "a balanced";
  const jawDesc = m.jawWidthRatio > 0.85 ? "a strong jawline" : "a softer jawline";
  const foreheadDesc =
    m.foreheadWidthRatio > m.jawWidthRatio + 0.08 ? "a wider forehead" : "even proportions up top";
  return `Detected ${lengthDesc} face with ${jawDesc} and ${foreheadDesc}, most consistent with a ${shape} shape.`;
}

/** Classify a detected face into one of the six supported shapes. */
export function classifyFaceShape(landmarks: Landmark2D[]): {
  faceShape: FaceShape;
  confidence: number;
  candidates: FaceShapeScore[];
  summary: string;
  landmarks: FaceLandmarkHints;
} | null {
  const measurements = measureFace(landmarks);
  if (!measurements) return null;

  const candidates = scoreShapes(measurements);
  const primary = candidates[0]!;

  return {
    faceShape: primary.shape,
    confidence: primary.confidence,
    candidates: candidates.slice(0, 4),
    summary: summarize(primary.shape, measurements),
    landmarks: {
      faceWidthRatio: measurements.faceWidthRatio,
      faceLengthRatio: measurements.faceLengthRatio,
      jawWidthRatio: measurements.jawWidthRatio,
      foreheadWidthRatio: measurements.foreheadWidthRatio,
    },
  };
}
