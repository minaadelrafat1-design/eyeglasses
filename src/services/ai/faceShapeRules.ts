/**
 * Styling knowledge base: how each face shape relates to each frame shape.
 *
 * This is domain knowledge, not a hardcoded product list. Scores are affinity
 * values in the 0–1 range and are combined with catalog data at request time.
 */
import type { FaceShape, FrameShape } from '@/types';

export const FRAME_SHAPES: FrameShape[] = [
  'round',
  'square',
  'rectangular',
  'oval',
  'cat-eye',
  'aviator',
  'geometric',
];

type AffinityMatrix = Record<FaceShape, Record<FrameShape, number>>;

export const FACE_FRAME_AFFINITY: AffinityMatrix = {
  oval: { rectangular: 0.95, square: 0.9, geometric: 0.85, 'cat-eye': 0.82, aviator: 0.8, round: 0.75, oval: 0.7 },
  round: { rectangular: 0.95, square: 0.92, geometric: 0.86, 'cat-eye': 0.8, aviator: 0.7, oval: 0.55, round: 0.35 },
  square: { round: 0.95, oval: 0.92, aviator: 0.86, 'cat-eye': 0.78, geometric: 0.6, rectangular: 0.45, square: 0.35 },
  heart: { oval: 0.94, round: 0.9, aviator: 0.88, 'cat-eye': 0.72, rectangular: 0.68, geometric: 0.6, square: 0.5 },
  diamond: { oval: 0.94, 'cat-eye': 0.92, round: 0.86, rectangular: 0.7, aviator: 0.68, geometric: 0.6, square: 0.5 },
  rectangle: { round: 0.93, square: 0.9, oval: 0.86, geometric: 0.8, 'cat-eye': 0.72, aviator: 0.7, rectangular: 0.45 },
};

export const FACE_SHAPE_GUIDANCE: Record<FaceShape, string> = {
  oval: 'Balanced proportions give you the widest choice. Frames as wide as the broadest part of your face keep that balance, and angular silhouettes add definition.',
  round: 'Soft curves and similar width and length respond well to angular frames — straight brow lines and defined corners lengthen and sculpt the face.',
  square: 'A strong jaw and broad forehead are softened by curved frames. Rounded and oval silhouettes ease the angles without hiding them.',
  heart: 'A wider forehead tapering to a narrow chin suits frames that are lighter on top and gently rounded, shifting attention downward.',
  diamond: 'Prominent cheekbones with a narrow forehead and chin pair beautifully with frames that have detail or sweep along the brow line.',
  rectangle: 'A longer face is visually shortened by deeper frames with soft edges, adding width across the middle of the face.',
};

export const FACE_SHAPE_LABEL: Record<FaceShape, string> = {
  oval: 'Oval',
  round: 'Round',
  square: 'Square',
  heart: 'Heart',
  diamond: 'Diamond',
  rectangle: 'Rectangle',
};

export const FRAME_SHAPE_LABEL: Record<FrameShape, string> = {
  round: 'Round',
  square: 'Square',
  rectangular: 'Rectangular',
  oval: 'Oval',
  'cat-eye': 'Cat-eye',
  aviator: 'Aviator',
  geometric: 'Geometric',
};

export function frameAffinity(face: FaceShape, frame: FrameShape | null): number {
  if (!frame) return 0.5;
  return FACE_FRAME_AFFINITY[face][frame] ?? 0.5;
}

/** Frame shapes ranked most-to-least flattering for a face shape. */
export function flatteringFrameShapes(face: FaceShape, limit = 3): FrameShape[] {
  return [...FRAME_SHAPES]
    .sort((a, b) => frameAffinity(face, b) - frameAffinity(face, a))
    .slice(0, limit);
}