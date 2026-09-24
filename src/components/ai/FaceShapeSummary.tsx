import { Badge, Card } from '@/components/vui';
import { FACE_SHAPE_LABEL, FRAME_SHAPE_LABEL } from '@/services/ai';
import type { FaceAnalysis, FrameShape } from '@/types';

export interface FaceShapeSummaryProps {
  analysis: FaceAnalysis;
  guidance: string;
  suggestedFrameShapes: FrameShape[];
}

export function FaceShapeSummary({
  analysis,
  guidance,
  suggestedFrameShapes,
}: FaceShapeSummaryProps) {
  const confidencePct = Math.round(analysis.confidence * 100);

  return (
    <Card className="p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="primary">Face analysis</Badge>
        {analysis.provider === 'manual' ? (
          <span className="text-sm text-ink-500">Selected manually</span>
        ) : (
          <span className="text-sm text-ink-500">{confidencePct}% confidence</span>
        )}
      </div>

      <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
        Your face shape appears {FACE_SHAPE_LABEL[analysis.faceShape].toLowerCase()}
      </h2>

      {analysis.summary && <p className="mt-3 text-ink-600">{analysis.summary}</p>}
      <p className="mt-3 text-ink-600">{guidance}</p>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-ink-900">Frame shapes to look for</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedFrameShapes.map((shape) => (
            <Badge key={shape} variant="secondary">
              {FRAME_SHAPE_LABEL[shape]}
            </Badge>
          ))}
        </div>
      </div>

      {analysis.candidates.length > 1 && (
        <div className="mt-6 border-t border-ink-200 pt-5">
          <h3 className="text-sm font-semibold text-ink-900">Other possible readings</h3>
          <ul className="mt-3 space-y-2">
            {analysis.candidates
              .filter((candidate) => candidate.shape !== analysis.faceShape)
              .map((candidate) => (
                <li key={candidate.shape} className="flex items-center gap-3 text-sm text-ink-600">
                  <span className="w-24">{FACE_SHAPE_LABEL[candidate.shape]}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <span
                      className="block h-full rounded-full bg-primary-500"
                      style={{ width: `${Math.round(candidate.confidence * 100)}%` }}
                    />
                  </span>
                  <span className="w-10 text-right tabular-nums">
                    {Math.round(candidate.confidence * 100)}%
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </Card>
  );
}