import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Badge, Button, Card, Spinner } from '@/components/vui';
import { PreferencePanel, RecommendationResults, SelfieUpload } from '@/components/ai';
import { getGlassesRecommendations } from '@/services/recommendationService';
import { useRecentlyViewed, useWishlist } from '@/context';
import type { FaceShape, RecommendationInput, RecommendationOutcome, StylePreferences } from '@/types';

const DEFAULT_PREFERENCES: StylePreferences = {
  frameShapes: [],
  colors: [],
  minPriceCents: 0,
  maxPriceCents: 35000,
  notes: '',
};

export function AssistantPage() {
  const [selfie, setSelfie] = useState<string | null>(null);
  const [manualFaceShape, setManualFaceShape] = useState<FaceShape | null>(null);
  const [preferences, setPreferences] = useState<StylePreferences>(DEFAULT_PREFERENCES);

  const { items: recentlyViewed } = useRecentlyViewed();
  const { items: wishlist } = useWishlist();

  const mutation = useMutation<RecommendationOutcome, Error, RecommendationInput>({
    mutationFn: (input) => getGlassesRecommendations(input, { limit: 6 }),
  });

  const canSubmit = Boolean(selfie || manualFaceShape);

  const handleSubmit = () => {
    mutation.mutate({
      imageDataUrl: selfie,
      manualFaceShape,
      preferences,
      browsing: {
        recentlyViewedProductIds: recentlyViewed,
        wishlistProductIds: wishlist,
      },
    });
  };

  return (
    <div className="container-app py-14 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="primary" className="mb-4">
          AI
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          Find frames that suit your face
        </h1>
        <p className="mt-5 text-lg text-ink-500 text-pretty">
          Upload a selfie and our AI reads your face shape, then matches it with frame shape,
          colour, budget and the styles you have been browsing.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
        <Card className="p-6 md:p-7 lg:sticky lg:top-24">
          <SelfieUpload value={selfie} onChange={setSelfie} disabled={mutation.isPending} />

          <div className="mt-8 border-t border-ink-200 pt-7">
            <PreferencePanel
              preferences={preferences}
              onChange={setPreferences}
              manualFaceShape={manualFaceShape}
              onManualFaceShapeChange={setManualFaceShape}
              disabled={mutation.isPending}
            />
          </div>

          <div className="mt-8 flex gap-2">
            <Button
              fullWidth
              onClick={handleSubmit}
              disabled={!canSubmit}
              isLoading={mutation.isPending}
            >
              <Sparkles className="h-4 w-4" />
              {mutation.data ? 'Update recommendations' : 'Get recommendations'}
            </Button>
            {mutation.data && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelfie(null);
                  setManualFaceShape(null);
                  setPreferences(DEFAULT_PREFERENCES);
                  mutation.reset();
                }}
                aria-label="Start over"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
          {!canSubmit && (
            <p className="mt-3 text-center text-xs text-ink-500">
              Add a selfie or pick your face shape to continue.
            </p>
          )}
        </Card>

        <div>
          {mutation.isPending && (
            <Card className="flex flex-col items-center justify-center gap-4 p-16 text-center">
              <Spinner size={28} />
              <p className="text-ink-600">Analysing your features and matching frames…</p>
            </Card>
          )}

          {mutation.isError && !mutation.isPending && (
            <Card className="p-8">
              <h2 className="text-lg font-semibold text-ink-900">We couldn't finish the analysis</h2>
              <p className="mt-2 text-ink-600">{mutation.error.message}</p>
              <Button variant="outline" className="mt-5" onClick={handleSubmit}>
                Try again
              </Button>
            </Card>
          )}

          {mutation.data && !mutation.isPending && (
            <RecommendationResults outcome={mutation.data} />
          )}

          {!mutation.data && !mutation.isPending && !mutation.isError && (
            <Card className="p-8 md:p-10">
              <h2 className="text-lg font-semibold text-ink-900">How it works</h2>
              <ol className="mt-5 space-y-5">
                {[
                  ['Upload a selfie', 'Straight-on, good light, hair off your face.'],
                  ['We read your face shape', 'Oval, round, square, heart, diamond or rectangle.'],
                  ['Tell us your taste', 'Frame shape, colour palette and budget.'],
                  ['See explained matches', 'Every frame comes with the reason it was chosen.'],
                ].map(([title, body], index) => (
                  <li key={title} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-800">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-ink-900">{title}</p>
                      <p className="mt-1 text-sm text-ink-600">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-8 text-sm text-ink-500">
                AR try-on plugs into the same result set — each recommendation already carries the
                product and variant references the try-on pipeline needs.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
