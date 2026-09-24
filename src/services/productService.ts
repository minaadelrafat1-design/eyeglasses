import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  localBrands,
  localColors,
  localProductBySlug,
  localProducts,
  localProductsByIds,
  localSimilarProducts,
} from './catalogFallback';
import { ApiError } from '@/types';
import type {
  Product,
  ProductImage,
  ProductVariant,
  Category,
  Brand,
  Color,
  FrameShapeOption,
  MaterialOption,
  SizeOption,
} from '@/types';

/**
 * Product service — all catalog reads go through here.
 *
 * The browser talks directly to Postgres via the Supabase anon client,
 * gated by row-level security. This module keeps query construction in one
 * place so future caching, pagination, or server-side moves are centralized.
 */

export interface ProductQuery {
  categorySlug?: string;
  shapes?: string[];
  materials?: string[];
  genders?: string[];
  lensTypes?: string[];
  brands?: string[];
  colors?: string[];
  search?: string;
  onSale?: boolean;
  inStock?: boolean;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'rating';
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand_id: string | null;
  description: string | null;
  shape_id: string | null;
  material_id: string | null;
  gender: string;
  lens_type: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  status: string;
  rating: number | null;
  review_count: number;
  created_at: string;
  updated_at: string;
  brand: { slug: string; name: string } | null;
  shape: { slug: string; name: string } | null;
  material: { slug: string; name: string } | null;
  images: { id: string; url: string; alt_text: string | null; position: number; is_ai_generated: boolean }[];
  variants: {
    id: string;
    color_id: string | null;
    size_id: string | null;
    name: string;
    lens_tint: string | null;
    price_cents: number;
    stock: number;
    sku: string;
  }[];
  product_categories: { category_id: string }[];
}

const PAGE_SIZE = 24;

function mapRow(row: ProductRow, categorySlugById: Map<string, string>): Product {
  const categorySlugs = row.product_categories
    .map((pc) => categorySlugById.get(pc.category_id))
    .filter(Boolean) as string[];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brandId: row.brand_id,
    brandName: row.brand?.name ?? null,
    description: row.description,
    shapeId: row.shape_id,
    shape: (row.shape?.slug as Product['shape']) ?? null,
    materialId: row.material_id,
    material: (row.material?.slug as Product['material']) ?? null,
    gender: row.gender as Product['gender'],
    lensType: row.lens_type as Product['lensType'],
    priceCents: row.price_cents,
    compareAtPriceCents: row.compare_at_price_cents,
    status: row.status as Product['status'],
    rating: row.rating !== null ? Number(row.rating) : null,
    reviewCount: row.review_count,
    categorySlugs,
    images: (row.images ?? []).map((img) => ({
      id: img.id,
      productId: row.id,
      url: img.url,
      altText: img.alt_text,
      position: img.position,
      isAiGenerated: img.is_ai_generated,
    })),
    variants: (row.variants ?? []).map((v) => ({
      id: v.id,
      productId: row.id,
      colorId: v.color_id,
      sizeId: v.size_id,
      name: v.name,
      lensTint: v.lens_tint,
      priceCents: v.price_cents,
      stock: v.stock,
      sku: v.sku,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadCategoryMap(): Promise<Map<string, string>> {
  const { data } = await supabase.from('categories').select('id, slug');
  return new Map((data ?? []).map((c) => [c.id, c.slug]));
}

export async function fetchProducts(query: ProductQuery = {}): Promise<ProductListResult> {
  if (!isSupabaseConfigured) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = query.pageSize ?? PAGE_SIZE;
    const all = localProducts(query);
    const from = (page - 1) * pageSize;
    return { items: all.slice(from, from + pageSize), total: all.length, page, pageSize };
  }

  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let req = supabase
    .from('products')
    .select(
      `*, brand:brands(slug, name), shape:frame_shapes(slug, name),
      material:materials(slug, name),
      images:product_images(*), variants:product_variants(*),
      product_categories(category_id)`,
      { count: 'exact' },
    )
    .eq('status', 'active');

  if (query.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', query.categorySlug)
      .maybeSingle();
    if (cat) {
      const { data: links } = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('category_id', cat.id);
      const productIds = (links ?? []).map((l) => l.product_id);
      req = req.in('id', productIds.length ? productIds : ['00000000-0000-0000-0000-000000000000']);
    }
  }

  if (query.shapes?.length) req = req.in('shape_id', await idsForSlugs('frame_shapes', query.shapes));
  if (query.materials?.length) req = req.in('material_id', await idsForSlugs('materials', query.materials));
  if (query.genders?.length) req = req.in('gender', query.genders);
  if (query.lensTypes?.length) req = req.in('lens_type', query.lensTypes);
  if (query.brands?.length) {
    const { data: brandRows } = await supabase.from('brands').select('id').in('slug', query.brands);
    const brandIds = (brandRows ?? []).map((b) => b.id);
    req = req.in('brand_id', brandIds.length ? brandIds : ['00000000-0000-0000-0000-000000000000']);
  }
  if (query.colors?.length) {
    const { data: colorRows } = await supabase.from('colors').select('id').in('slug', query.colors);
    const colorIds = (colorRows ?? []).map((c) => c.id);
    const { data: variantLinks } = await supabase
      .from('product_variants')
      .select('product_id')
      .in('color_id', colorIds.length ? colorIds : ['00000000-0000-0000-0000-000000000000']);
    const productIds = Array.from(new Set((variantLinks ?? []).map((v) => v.product_id)));
    req = req.in('id', productIds.length ? productIds : ['00000000-0000-0000-0000-000000000000']);
  }
  if (query.onSale) req = req.not('compare_at_price_cents', 'is', null);
  if (query.inStock) req = req.gt('variants.stock', 0);
  if (query.minPriceCents !== undefined) req = req.gte('price_cents', query.minPriceCents);
  if (query.maxPriceCents !== undefined) req = req.lte('price_cents', query.maxPriceCents);
  if (query.search) {
    req = req.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`);
  }

  switch (query.sort) {
    case 'price-asc':
      req = req.order('price_cents', { ascending: true });
      break;
    case 'price-desc':
      req = req.order('price_cents', { ascending: false });
      break;
    case 'rating':
      req = req.order('rating', { ascending: false, nullsFirst: false });
      break;
    default:
      req = req.order('created_at', { ascending: false });
  }

  req = req.range(from, to);

  const { data, error, count } = await req;

  if (error) throw new ApiError(error.message, 500, error.code);

  const categoryMap = await loadCategoryMap();
  const items = (data ?? []).map((row) => mapRow(row as unknown as ProductRow, categoryMap));
  return { items, total: count ?? 0, page, pageSize };
}

async function idsForSlugs(table: string, slugs: string[]): Promise<string[]> {
  const { data } = await supabase
    .from(table as 'brands')
    .select('id')
    .in('slug', slugs);
  return (data ?? []).map((r) => r.id);
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured) return localProductBySlug(slug);

  const { data, error } = await supabase
    .from('products')
    .select(
      `*, brand:brands(slug, name), shape:frame_shapes(slug, name),
      material:materials(slug, name),
      images:product_images(*), variants:product_variants(*),
      product_categories(category_id)`,
    )
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw new ApiError(error.message, 500, error.code);
  if (!data) return null;

  const categoryMap = await loadCategoryMap();
  return mapRow(data as unknown as ProductRow, categoryMap);
}

export async function fetchCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []) as unknown as Category[];
}

export async function fetchBrands(): Promise<Brand[]> {
  if (!isSupabaseConfigured) return localBrands();
  const { data, error } = await supabase.from('brands').select('*').order('name');
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []) as unknown as Brand[];
}

export async function fetchColors(): Promise<Color[]> {
  if (!isSupabaseConfigured) return localColors();
  const { data, error } = await supabase.from('colors').select('*').order('name');
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []) as unknown as Color[];
}

export async function fetchFrameShapes(): Promise<FrameShapeOption[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('frame_shapes').select('*').order('name');
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []) as unknown as FrameShapeOption[];
}

export async function fetchMaterials(): Promise<MaterialOption[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('materials').select('*').order('name');
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []) as unknown as MaterialOption[];
}

export async function fetchSizes(): Promise<SizeOption[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('sizes').select('*').order('size_mm');
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []) as unknown as SizeOption[];
}

/**
 * Resolve a list of product ids, preserving the order they were requested in.
 * Powers the comparison tray and the recently viewed row.
 */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  if (!isSupabaseConfigured) return localProductsByIds(ids);

  const { data, error } = await supabase
    .from('products')
    .select(
      `*, brand:brands(slug, name), shape:frame_shapes(slug, name),
      material:materials(slug, name),
      images:product_images(*), variants:product_variants(*),
      product_categories(category_id)`,
    )
    .in('id', ids);

  if (error) throw new ApiError(error.message, 500, error.code);

  const categoryMap = await loadCategoryMap();
  const byId = new Map(
    (data ?? []).map((row) => {
      const product = mapRow(row as unknown as ProductRow, categoryMap);
      return [product.id, product] as const;
    }),
  );
  return ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
}

/**
 * Similar frames for a product. Ranking is deterministic today (shared shape,
 * material, category and price band); an AI recommender can replace the
 * ranking step without changing this signature.
 */
export async function fetchSimilarProducts(product: Product, limit = 4): Promise<Product[]> {
  if (!isSupabaseConfigured) return localSimilarProducts(product, limit);

  const { items } = await fetchProducts({ pageSize: 48 });
  return items
    .filter((p) => p.id !== product.id)
    .map((p) => ({
      p,
      score:
        (p.shape === product.shape ? 3 : 0) +
        (p.material === product.material ? 2 : 0) +
        (p.gender === product.gender ? 1 : 0) +
        p.categorySlugs.filter((c) => product.categorySlugs.includes(c)).length * 2,
    }))
    .sort((a, b) => b.score - a.score || (b.p.rating ?? 0) - (a.p.rating ?? 0))
    .slice(0, limit)
    .map((entry) => entry.p);
}
