/**
 * AI try-on domain types.
 *
 * Vendor neutral: the UI and services speak this contract, while concrete
 * generators (Lovable AI today, another image model or an AR pipeline later)
 * live behind the try-on provider interface.
 */
import type { ISODateString, UUID } from './domain';

export type TryOnStatus = 'pending' | 'succeeded' | 'failed';

/** What the customer asked to try on. */
export interface TryOnGenerationInput {
  productId: string;
  productSlug: string | null;
  productName: string;
  brandName: string | null;
  /** Public URL of the frame product shot handed to the generator. */
  productImageUrl: string | null;
  variantId: string | null;
  variantLabel: string | null;
  /** Customer photo as a data URL (already downscaled in the browser). */
  selfieDataUrl: string;
}

/** A persisted try-on attempt. */
export interface TryOnGeneration {
  id: UUID;
  productId: string;
  productSlug: string | null;
  productName: string;
  brandName: string | null;
  productImageUrl: string | null;
  variantId: string | null;
  variantLabel: string | null;
  /** Storage object paths inside the private try-on bucket. */
  sourceImagePath: string | null;
  resultImagePath: string | null;
  status: TryOnStatus;
  provider: string;
  errorMessage: string | null;
  createdAt: ISODateString;
}

/** A generation plus browser-displayable URLs. */
export interface TryOnGenerationView extends TryOnGeneration {
  /** Signed (or inline data) URL for the generated image. */
  resultImageUrl: string | null;
  sourceImageUrl: string | null;
}
