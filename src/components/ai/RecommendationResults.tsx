import { Card } from '@/components/vui';
import { RecommendationCard } from './RecommendationCard';
import { FaceShapeSummary } from './FaceShapeSummary';
import type { RecommendationOutcome } from '@/types';

export interface RecommendationResultsProps {
  outcome: RecommendationOutcome;
}

export function RecommendationResults({ outcome }: RecommendationResultsProps) {
  const { analysis, recommendations, guidance, suggestedFrameShapes } = outcome;

  return (
    <div className="space-y-10">
      <FaceShapeSummary
        analysis={analysis}
        guidance={guidance}
        suggestedFrameShapes={suggestedFrameShapes}
      />

      <section aria-labelledby="recommended-frames">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="recommended-frames" className="text-2xl font-semibold tracking-tight">
              Recommended frames
            </h2>
            <p className="mt-2 text-ink-600">
              Ranked by face shape fit, your style and budget, and the frames you have browsed.
            </p>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <Card className="mt-6 p-8 text-center text-ink-600">
            No frames matched those preferences. Try widening your budget or clearing a filter.
          </Card>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={recommendation.product.id}
                recommendation={recommendation}
                rank={index + 1}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}