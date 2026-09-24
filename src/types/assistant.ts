/**
 * Shopping assistant domain types.
 *
 * These describe the contract between the chat UI, the assistant service
 * layer and any concrete assistant provider (Lovable AI today, another
 * conversational backend tomorrow). Nothing here is vendor specific and
 * nothing here carries personally identifiable customer data.
 */
import type { FaceShape } from './ai';
import type { FrameMaterial, FrameShape, LensType, Money, UUID } from './domain';

export type AssistantRole = 'user' | 'assistant';

/** Compact, display-ready product reference returned alongside a reply. */
export interface AssistantProductRef {
  id: UUID;
  slug: string;
  name: string;
  brandName: string | null;
  priceCents: Money;
  compareAtPriceCents: Money | null;
  imageUrl: string | null;
  shape: FrameShape | null;
  material: FrameMaterial | null;
  lensType: LensType;
  inStock: boolean;
  /** Deep link into the product page. */
  productPath: string;
  /** Deep link into the try-on studio — also the hook for AR try-on. */
  tryOnPath: string;
}

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  /** Frames surfaced with this message, empty for plain answers. */
  products: AssistantProductRef[];
  /** Suggested follow-up prompts rendered as chips. */
  suggestions: string[];
  createdAt: string;
  /** True when the turn failed; the bubble renders in an error style. */
  failed?: boolean;
  pending?: boolean;
}

/** A single turn of history sent to the provider. Text only, by design. */
export interface AssistantTurn {
  role: AssistantRole;
  content: string;
}

/**
 * Anonymous shopping context. Contains no name, email, address or account id:
 * only catalog identifiers and stated preferences, so the model never sees
 * customer data it does not need.
 */
export interface AssistantShopperContext {
  /** Detected or manually chosen face shape, when the customer shared one. */
  faceShape: FaceShape | null;
  recentlyViewedProductIds: UUID[];
  wishlistProductIds: UUID[];
  compareProductIds: UUID[];
  /** Slug of the product the customer is currently looking at, if any. */
  currentProductSlug: string | null;
  /** Budget ceiling in cents when the customer has stated one. */
  maxPriceCents: Money | null;
  /** True once an AR try-on pipeline is available in this session. */
  arTryOnAvailable: boolean;
}

export interface AssistantTurnRequest {
  /** Full prior conversation plus the new user message, oldest first. */
  messages: AssistantTurn[];
  context: AssistantShopperContext;
}

export interface AssistantTurnResult {
  reply: string;
  products: AssistantProductRef[];
  suggestions: string[];
  /** Names of the catalog tools the assistant used for this answer. */
  toolsUsed: string[];
  provider: string;
  respondedAt: string;
}

export function emptyShopperContext(): AssistantShopperContext {
  return {
    faceShape: null,
    recentlyViewedProductIds: [],
    wishlistProductIds: [],
    compareProductIds: [],
    currentProductSlug: null,
    maxPriceCents: null,
    arTryOnAvailable: false,
  };
}
