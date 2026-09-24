/**
 * Server-side catalog access for the shopping assistant.
 *
 * The assistant never talks to the storefront services directly: it calls the
 * narrow, read-only helpers in this module. That keeps the tool surface small,
 * auditable, and independent of where catalog data lives (bundled catalog
 * today, database-backed reads later without touching prompt or UI code).
 */
import {
  localProductBySlug,
  localProducts,
  localProductsByIds,
  localSimilarProducts,
  variantColorName,
  variantSizeMm,
} from '@/services/catalogFallback';
import { flatteringFrameShapes } from '@/services/ai/faceShapeRules';
import type { AssistantProductRef } from '@/types/assistant';
import type { FaceShape } from '@/types/ai';
import type { Product } from '@/types/domain';

export interface CatalogSearchArgs {
  search?: string;
  categorySlug?: string;
  shapes?: string[];
  materials?: string[];
  genders?: string[];
  lensTypes?: string[];
  colors?: string[];
  maxPriceCents?: number;
  minPriceCents?: number;
  onSale?: boolean;
  inStockOnly?: boolean;
  faceShape?: string;
  sort?: string;
  limit?: number;
}

export function productInStock(product: Product): boolean {
  return product.variants.some((variant) => variant.stock > 0);
}

export function toProductRef(product: Product): AssistantProductRef {
  const image = [...product.images].sort((a, b) => a.position - b.position)[0];
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brandName: product.brandName,
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
    imageUrl: image?.url ?? null,
    shape: product.shape,
    material: product.material,
    lensType: product.lensType,
    inStock: productInStock(product),
    productPath: `/product/${product.slug}`,
    tryOnPath: `/try-on?product=${product.slug}`,
  };
}

/** Compact model-facing description of a frame. */
export function describeProduct(product: Product) {
  const colors = [...new Set(product.variants.map((v) => variantColorName(v.name)))];
  const sizes = [
    ...new Set(
      product.variants
        .map((v) => variantSizeMm(v.name))
        .filter((mm): mm is number => mm !== null),
    ),
  ].sort((a, b) => a - b);

  return {
    slug: product.slug,
    name: product.name,
    brand: product.brandName,
    priceUsd: (product.priceCents / 100).toFixed(2),
    compareAtUsd:
      product.compareAtPriceCents === null
        ? null
        : (product.compareAtPriceCents / 100).toFixed(2),
    shape: product.shape,
    material: product.material,
    gender: product.gender,
    lensType: product.lensType,
    categories: product.categorySlugs,
    colors,
    lensWidthsMm: sizes,
    rating: product.rating,
    reviewCount: product.reviewCount,
    inStock: productInStock(product),
    unitsAvailable: product.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0),
    description: product.description ? product.description.slice(0, 320) : null,
  };
}

function normaliseList(values: string[] | undefined): string[] | undefined {
  if (!values || values.length === 0) return undefined;
  return values.map((value) => String(value).toLowerCase().trim()).filter(Boolean);
}

export function searchCatalog(args: CatalogSearchArgs): Product[] {
  const shapes = normaliseList(args.shapes) ?? [];
  const faceShape = args.faceShape ? (String(args.faceShape) as FaceShape) : null;
  const faceShapes = faceShape ? flatteringFrameShapes(faceShape) : [];
  const mergedShapes = [...new Set([...shapes, ...faceShapes])];

  const results = localProducts({
    search: args.search,
    categorySlug: args.categorySlug,
    shapes: mergedShapes.length > 0 ? mergedShapes : undefined,
    materials: normaliseList(args.materials),
    genders: normaliseList(args.genders),
    lensTypes: normaliseList(args.lensTypes),
    colors: normaliseList(args.colors),
    minPriceCents: args.minPriceCents,
    maxPriceCents: args.maxPriceCents,
    onSale: args.onSale,
    inStock: args.inStockOnly,
    sort: args.sort,
  });

  const limit = Math.min(Math.max(args.limit ?? 4, 1), 8);
  return results.slice(0, limit);
}

export function productBySlug(slug: string): Product | null {
  return localProductBySlug(slug);
}

export function productsBySlugs(slugs: string[]): Product[] {
  return slugs
    .map((slug) => localProductBySlug(slug))
    .filter((product): product is Product => product !== null);
}

export function productsByIds(ids: string[]): Product[] {
  return localProductsByIds(ids);
}

export function similarProducts(slug: string, limit = 4): Product[] {
  const base = localProductBySlug(slug);
  return base ? localSimilarProducts(base, limit) : [];
}
