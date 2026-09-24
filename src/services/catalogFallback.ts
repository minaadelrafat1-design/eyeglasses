import type { Brand, Color, Product } from "@/types";
import { products as catalogProducts } from "@/data/catalog";

/**
 * Local catalog fallback.
 *
 * The service layer reads from the database whenever Lovable Cloud
 * credentials are present. Until then — and whenever the database is
 * unreachable — these helpers serve the bundled catalog so the storefront,
 * filters and comparison stay fully functional. The shapes returned here are
 * identical to the database-backed ones, so call sites never branch.
 */

export interface LocalQuery {
  categorySlug?: string | undefined;
  shapes?: string[] | undefined;
  materials?: string[] | undefined;
  genders?: string[] | undefined;
  lensTypes?: string[] | undefined;
  brands?: string[] | undefined;
  colors?: string[] | undefined;
  onSale?: boolean | undefined;
  inStock?: boolean | undefined;
  minPriceCents?: number | undefined;
  maxPriceCents?: number | undefined;
  search?: string | undefined;
  sort?: string | undefined;
}

export function brandSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/** Colour tokens are encoded in variant names ("Tortoise / 52mm"). */
export function variantColorName(variantName: string): string {
  return (variantName.split("/")[0] ?? variantName).trim();
}

/** Size in millimetres encoded in variant names ("Matte Black / 52mm"). */
export function variantSizeMm(variantName: string): number | null {
  const match = variantName.match(/(\d{2})\s*mm/i);
  return match ? Number(match[1]) : null;
}

const COLOR_HEX: Record<string, string> = {
  black: "#111827",
  "matte black": "#1f2937",
  tortoise: "#8b5a2b",
  crystal: "#e5e7eb",
  gold: "#d4af37",
  "brushed gold": "#cfa94d",
  silver: "#c0c5ce",
  gunmetal: "#53565a",
  havana: "#7b4b2a",
  amber: "#c67c2b",
  rose: "#d99ba0",
  "rose gold": "#b76e79",
  navy: "#1f2a44",
  olive: "#6b705c",
  clear: "#eef2f7",
  smoke: "#6b7280",
  brown: "#6b4423",
  blue: "#2f7bff",
};

export function localBrands(): Brand[] {
  const names = Array.from(
    new Set(catalogProducts.map((p) => p.brandName).filter((n): n is string => Boolean(n))),
  ).sort();
  return names.map((name) => ({
    id: `brand-${brandSlug(name)}`,
    slug: brandSlug(name),
    name,
    description: null,
  }));
}

export function localColors(): Color[] {
  const names = new Set<string>();
  for (const product of catalogProducts) {
    for (const variant of product.variants) names.add(variantColorName(variant.name));
  }
  return Array.from(names)
    .sort()
    .map((name) => ({
      id: `color-${brandSlug(name)}`,
      slug: brandSlug(name),
      name,
      hexCode: COLOR_HEX[name.toLowerCase()] ?? null,
    }));
}

function matches(product: Product, q: LocalQuery): boolean {
  if (q.categorySlug && !product.categorySlugs.includes(q.categorySlug)) return false;
  if (q.shapes?.length && (!product.shape || !q.shapes.includes(product.shape))) return false;
  if (q.materials?.length && (!product.material || !q.materials.includes(product.material))) return false;
  if (q.genders?.length && !q.genders.includes(product.gender)) return false;
  if (q.lensTypes?.length && !q.lensTypes.includes(product.lensType)) return false;
  if (q.brands?.length && !q.brands.includes(brandSlug(product.brandName ?? ""))) return false;
  if (q.colors?.length) {
    const slugs = product.variants.map((v) => brandSlug(variantColorName(v.name)));
    if (!slugs.some((s) => q.colors!.includes(s))) return false;
  }
  if (q.onSale && product.compareAtPriceCents === null) return false;
  if (q.inStock && !product.variants.some((v) => v.stock > 0)) return false;
  if (q.minPriceCents !== undefined && product.priceCents < q.minPriceCents) return false;
  if (q.maxPriceCents !== undefined && product.priceCents > q.maxPriceCents) return false;
  if (q.search) {
    const needle = q.search.toLowerCase();
    const haystack = `${product.name} ${product.brandName ?? ""} ${product.description ?? ""}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

function sortProducts(items: Product[], sort: string | undefined): Product[] {
  const sorted = [...items];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.priceCents - b.priceCents);
    case "price-desc":
      return sorted.sort((a, b) => b.priceCents - a.priceCents);
    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export function localProducts(q: LocalQuery = {}): Product[] {
  return sortProducts(catalogProducts.filter((p) => matches(p, q)), q.sort);
}

export function localProductBySlug(slug: string): Product | null {
  return catalogProducts.find((p) => p.slug === slug) ?? null;
}

export function localProductsByIds(ids: string[]): Product[] {
  const byId = new Map(catalogProducts.map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
}

/**
 * Similar frames, scored by shared shape, material, category and price band.
 * The same scoring is reused as the deterministic baseline behind future AI
 * recommendations, so swapping in a model changes the ranking only.
 */
export function scoreSimilarity(base: Product, candidate: Product): number {
  let score = 0;
  if (candidate.shape && candidate.shape === base.shape) score += 3;
  if (candidate.material && candidate.material === base.material) score += 2;
  if (candidate.gender === base.gender) score += 1;
  if (candidate.lensType === base.lensType) score += 1;
  score += candidate.categorySlugs.filter((c) => base.categorySlugs.includes(c)).length * 2;
  const priceDelta = Math.abs(candidate.priceCents - base.priceCents);
  if (priceDelta < 5000) score += 2;
  else if (priceDelta < 10000) score += 1;
  return score;
}

export function localSimilarProducts(base: Product, limit = 4): Product[] {
  return catalogProducts
    .filter((p) => p.id !== base.id)
    .map((p) => ({ product: p, score: scoreSimilarity(base, p) }))
    .sort((a, b) => b.score - a.score || (b.product.rating ?? 0) - (a.product.rating ?? 0))
    .slice(0, limit)
    .map((entry) => entry.product);
}
