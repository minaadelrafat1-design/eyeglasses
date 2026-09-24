/**
 * Shopping assistant — shared, backend-agnostic pieces.
 *
 * The system prompt, tool schema, tool execution against the catalog, and
 * follow-up/dedup helpers are identical no matter which LLM backend answers
 * the turn. Each backend file (Lovable AI, OpenRouter, Gemini) only owns the
 * HTTP call and the wire-format adapter for that vendor's API shape.
 */
import {
  describeProduct,
  productBySlug,
  productsByIds,
  productsBySlugs,
  searchCatalog,
  similarProducts,
  type CatalogSearchArgs,
} from "./assistantCatalog.server";
import {
  GUIDANCE_TOPICS,
  guidanceFor,
  DEFAULT_SUGGESTIONS,
} from "@/services/ai/assistantKnowledge";
import { FACE_SHAPE_GUIDANCE, FACE_SHAPE_LABEL } from "@/services/ai/faceShapeRules";
import type { AssistantProductRef, AssistantShopperContext } from "@/types/assistant";
import type { Product } from "@/types/domain";

export const MAX_TOOL_ROUNDS = 4;
export const MAX_HISTORY_TURNS = 16;

export class AssistantError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AssistantError";
    this.status = status;
  }
}

/* -------------------------------------------------------------------------
 * Prompt
 * ---------------------------------------------------------------------- */

export const SYSTEM_PROMPT = [
  "You are the personal eyewear advisor for Vuera, a premium optical house.",
  "Voice: warm, precise, quietly confident. Never pushy, never salesy, never using exclamation marks.",
  "Keep answers short — two to four sentences — unless the customer asks for detail.",
  "",
  "Rules:",
  "- Always call search_products, get_product or compare_products before naming, pricing or recommending any frame. Never invent a product, price, colour or stock level.",
  "- Use explain_topic for questions about materials, sizing, lens options, coatings, face shapes, prescriptions, care, shipping and returns, and answer in your own words from what it returns.",
  "- When you recommend frames, explain briefly why each one suits what the customer told you. The frames themselves are shown as cards below your message, so do not repeat full specs as a list.",
  "- If nothing matches, say so plainly and offer the closest alternative you actually found.",
  "- Mention the virtual try-on studio when a customer is weighing up how a frame will look.",
  "- Never ask for or repeat personal data: no full name, email, phone, address, payment details or prescription values. Direct those to secure checkout or account pages.",
  "- Prices returned by tools are US dollars. Currency is USD.",
].join("\n");

export function contextBlock(context: AssistantShopperContext): string {
  const lines: string[] = ["Shopping context (anonymous, do not repeat verbatim):"];

  if (context.faceShape) {
    lines.push(
      `- Face shape: ${FACE_SHAPE_LABEL[context.faceShape] ?? context.faceShape}. ${
        FACE_SHAPE_GUIDANCE[context.faceShape] ?? ""
      }`.trim(),
    );
  }
  if (context.currentProductSlug) {
    lines.push(`- Currently viewing product slug: ${context.currentProductSlug}`);
  }
  if (context.maxPriceCents) {
    lines.push(`- Stated budget ceiling: $${(context.maxPriceCents / 100).toFixed(0)}`);
  }

  const named = (ids: string[]) =>
    productsByIds(ids)
      .slice(0, 5)
      .map((p) => p.slug)
      .join(", ");

  if (context.recentlyViewedProductIds.length > 0) {
    lines.push(`- Recently viewed slugs: ${named(context.recentlyViewedProductIds)}`);
  }
  if (context.wishlistProductIds.length > 0) {
    lines.push(`- Wishlist slugs: ${named(context.wishlistProductIds)}`);
  }
  if (context.compareProductIds.length > 0) {
    lines.push(`- Comparing slugs: ${named(context.compareProductIds)}`);
  }
  lines.push(
    context.arTryOnAvailable
      ? "- Live AR try-on is available in this session; you may offer to open it."
      : "- Photo-based virtual try-on is available at /try-on; live AR is coming soon.",
  );

  return lines.join("\n");
}

/* -------------------------------------------------------------------------
 * Tools — vendor-neutral JSON Schema. Each backend adapts this shape into
 * its own wire format (OpenAI-style `function`, Gemini `function_declarations`).
 * ---------------------------------------------------------------------- */

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export const TOOLS: ToolSpec[] = [
  {
    name: "search_products",
    description:
      "Search the Vuera catalog. Use for any discovery request such as colour, price ceiling, frame shape, material, gender, lens type, category or face shape.",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string", description: 'Free-text keywords, e.g. "tortoise round".' },
        categorySlug: { type: "string", description: "e.g. eyeglasses, sunglasses, blue-light." },
        shapes: {
          type: "array",
          items: { type: "string" },
          description: "round, square, rectangular, oval, cat-eye, aviator, geometric.",
        },
        materials: {
          type: "array",
          items: { type: "string" },
          description: "acetate, metal, titanium, mixed.",
        },
        genders: { type: "array", items: { type: "string" }, description: "unisex, men, women." },
        lensTypes: {
          type: "array",
          items: { type: "string" },
          description: "single-vision, progressive, reading, non-prescription, sunglasses.",
        },
        colors: {
          type: "array",
          items: { type: "string" },
          description: "Colour words such as black, tortoise, gold, crystal.",
        },
        minPriceCents: { type: "number", description: "Minimum price in cents." },
        maxPriceCents: {
          type: "number",
          description: "Maximum price in cents, e.g. 10000 for $100.",
        },
        onSale: { type: "boolean" },
        inStockOnly: { type: "boolean" },
        faceShape: {
          type: "string",
          description:
            "oval, round, square, heart, diamond, rectangle — expands the search to flattering shapes.",
        },
        sort: { type: "string", description: "newest, price-asc, price-desc or rating." },
        limit: { type: "number", description: "How many frames to return, 1-8. Default 4." },
      },
    },
  },
  {
    name: "get_product",
    description:
      "Full detail for one frame: price, colours, lens widths, material, stock and description.",
    parameters: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
    },
  },
  {
    name: "compare_products",
    description: "Side-by-side detail for two to four frames so you can explain the differences.",
    parameters: {
      type: "object",
      properties: { slugs: { type: "array", items: { type: "string" } } },
      required: ["slugs"],
    },
  },
  {
    name: "similar_products",
    description: 'Frames similar to a given one, for "something like this but ..." requests.',
    parameters: {
      type: "object",
      properties: { slug: { type: "string" }, limit: { type: "number" } },
      required: ["slug"],
    },
  },
  {
    name: "explain_topic",
    description: `Store guidance on one of: ${GUIDANCE_TOPICS.join(", ")}.`,
    parameters: {
      type: "object",
      properties: { topic: { type: "string", enum: GUIDANCE_TOPICS } },
      required: ["topic"],
    },
  },
];

export interface ToolOutcome {
  payload: unknown;
  products: Product[];
}

export function runTool(name: string, args: Record<string, unknown>): ToolOutcome {
  switch (name) {
    case "search_products": {
      const products = searchCatalog(args as CatalogSearchArgs);
      return {
        payload: { count: products.length, products: products.map(describeProduct) },
        products,
      };
    }
    case "get_product": {
      const product = productBySlug(String(args["slug"] ?? ""));
      if (!product) return { payload: { error: "No frame with that slug." }, products: [] };
      return { payload: describeProduct(product), products: [product] };
    }
    case "compare_products": {
      const slugs = Array.isArray(args["slugs"]) ? (args["slugs"] as string[]).map(String) : [];
      const products = productsBySlugs(slugs).slice(0, 4);
      return { payload: { products: products.map(describeProduct) }, products };
    }
    case "similar_products": {
      const limit = Number(args["limit"] ?? 4);
      const products = similarProducts(
        String(args["slug"] ?? ""),
        Number.isFinite(limit) ? limit : 4,
      );
      return { payload: { products: products.map(describeProduct) }, products };
    }
    case "explain_topic": {
      const entry = guidanceFor(String(args["topic"] ?? ""));
      return {
        payload: entry ?? { error: `Unknown topic. Available: ${GUIDANCE_TOPICS.join(", ")}` },
        products: [],
      };
    }
    default:
      return { payload: { error: `Unknown tool ${name}` }, products: [] };
  }
}

/* -------------------------------------------------------------------------
 * Follow-ups / dedupe
 * ---------------------------------------------------------------------- */

export function followUps(products: AssistantProductRef[]): string[] {
  if (products.length >= 2) {
    return [
      `Compare ${products[0]!.name} and ${products[1]!.name}`,
      "Show me these in another colour",
      "How do I pick the right size?",
    ];
  }
  if (products.length === 1) {
    return [
      `What sizes does ${products[0]!.name} come in?`,
      "Show me something similar but lighter",
      "What lens options can I add?",
    ];
  }
  return DEFAULT_SUGGESTIONS;
}

export function dedupe(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

/** Safely parse a tool-call argument string; malformed JSON degrades to `{}` rather than throwing. */
export function parseToolArgs(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}
