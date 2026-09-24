/**
 * Lovable AI face analysis provider. Delegates to the server function so the
 * API key and prompt never reach the browser.
 */
import { analyzeFaceShape } from '@/lib/ai/faceAnalysis.functions';
import type { FaceAnalysisProvider } from './provider';

export const lovableFaceAnalysisProvider: FaceAnalysisProvider = {
  id: 'lovable-ai',
  label: 'Lovable AI vision',
  async analyze(imageDataUrl) {
    return analyzeFaceShape({ data: { imageDataUrl } });
  },
};