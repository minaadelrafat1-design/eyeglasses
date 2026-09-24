import type { Product, Category } from '@/types';

/**
 * Static catalog used as a fallback when the database is unreachable.
 * In production these rows come from the `products` / `categories` tables
 * via the service layer. Prices are integer cents.
 */

export const categories: Category[] = [
  { id: 'cat-optical', slug: 'optical', name: 'Optical', description: 'Prescription frames for everyday clarity.', parentId: null },
  { id: 'cat-sunglasses', slug: 'sunglasses', name: 'Sunglasses', description: 'UV-protected shades in timeless silhouettes.', parentId: null },
  { id: 'cat-blue-light', slug: 'blue-light', name: 'Blue Light', description: 'Screen-friendly lenses for digital days.', parentId: null },
  { id: 'cat-readers', slug: 'readers', name: 'Readers', description: 'Magnifying frames for close-up focus.', parentId: null },
];

export type CatalogProduct = Product;

function base(
  slug: string, name: string, brandName: string, shape: Product['shape'], material: Product['material'],
  gender: Product['gender'], lensType: Product['lensType'], priceCents: number, compareAtCents: number | null,
  rating: number | null, reviewCount: number, description: string, categorySlugs: string[],
  images: Product['images'], variants: Product['variants'],
): CatalogProduct {
  return {
    id: `prod-${slug}`,
    slug, name, brandId: null, brandName, description,
    shapeId: null, shape, materialId: null, material,
    gender, lensType, priceCents, compareAtPriceCents: compareAtCents,
    status: 'active', rating, reviewCount, categorySlugs,
    images, variants,
    createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z',
  };
}

function img(id: string, productId: string, url: string, altText: string, position: number) {
  return { id, productId, url, altText, position, isAiGenerated: false };
}

function variant(id: string, productId: string, name: string, priceCents: number, stock: number, sku: string, lensTint: string | null = null) {
  return { id, productId, colorId: null, sizeId: null, name, lensTint, priceCents, stock, sku };
}

export const products: CatalogProduct[] = [
  base('aurora-cat-eye', 'Aurora', 'Vuera Studio', 'cat-eye', 'acetate', 'women', 'single-vision', 18900, null, 4.8, 124,
    'A sculpted cat-eye frame with a subtle upswept brow line. Hand-polished Italian acetate with stainless steel hinges.',
    ['optical', 'sunglasses'],
    [
      img('img-aurora-1', 'prod-aurora-cat-eye', 'https://images.pexels.com/photos/29811438/pexels-photo-29811438.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Aurora cat-eye frame on silk', 0),
      img('img-aurora-2', 'prod-aurora-cat-eye', 'https://images.pexels.com/photos/26100579/pexels-photo-26100579.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Model wearing Aurora frames', 1),
      img('img-aurora-3', 'prod-aurora-cat-eye', 'https://images.pexels.com/photos/29811437/pexels-photo-29811437.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Aurora frame detail with gold accents', 2),
    ],
    [
      variant('var-aurora-1', 'prod-aurora-cat-eye', 'Tortoise / 52mm', 18900, 18, 'VU-AUR-TT-52'),
      variant('var-aurora-2', 'prod-aurora-cat-eye', 'Matte Black / 52mm', 18900, 12, 'VU-AUR-BK-52'),
      variant('var-aurora-3', 'prod-aurora-cat-eye', 'Crystal / 50mm', 19900, 8, 'VU-AUR-CR-50'),
    ],
  ),
  base('meridian-aviator', 'Meridian', 'Vuera Studio', 'aviator', 'metal', 'unisex', 'sunglasses', 21900, null, 4.6, 89,
    'A modern take on the classic aviator. Lightweight titanium frame with gradient polarized lenses.',
    ['sunglasses'],
    [
      img('img-meridian-1', 'prod-meridian-aviator', 'https://images.pexels.com/photos/16625257/pexels-photo-16625257.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Meridian aviator sunglasses', 0),
      img('img-meridian-2', 'prod-meridian-aviator', 'https://images.pexels.com/photos/29271917/pexels-photo-29271917.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Model wearing Meridian sunglasses', 1),
      img('img-meridian-3', 'prod-meridian-aviator', 'https://images.pexels.com/photos/14464892/pexels-photo-14464892.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Meridian sunglasses urban setting', 2),
    ],
    [
      variant('var-meridian-1', 'prod-meridian-aviator', 'Gold / Green Lens', 21900, 22, 'VU-MER-GD-GR', 'Green'),
      variant('var-meridian-2', 'prod-meridian-aviator', 'Silver / Grey Lens', 21900, 15, 'VU-MER-SV-GY', 'Grey'),
      variant('var-meridian-3', 'prod-meridian-aviator', 'Black / Smoke Lens', 22900, 10, 'VU-MER-BK-SM', 'Smoke'),
    ],
  ),
  base('atlas-round', 'Atlas', 'North Optics', 'round', 'acetate', 'unisex', 'single-vision', 12900, 15900, 4.4, 67,
    'Perfectly round lenses in a chunky acetate frame. A statement piece inspired by 1960s intellectuals.',
    ['optical', 'blue-light'],
    [
      img('img-atlas-1', 'prod-atlas-round', 'https://images.pexels.com/photos/36310717/pexels-photo-36310717.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Atlas round frame on stand', 0),
      img('img-atlas-2', 'prod-atlas-round', 'https://images.pexels.com/photos/36713202/pexels-photo-36713202.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Model wearing round Atlas frames', 1),
      img('img-atlas-3', 'prod-atlas-round', 'https://images.pexels.com/photos/36713201/pexels-photo-36713201.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Atlas frame close-up', 2),
    ],
    [
      variant('var-atlas-1', 'prod-atlas-round', 'Crystal / 48mm', 12900, 30, 'VU-ATL-CR-48'),
      variant('var-atlas-2', 'prod-atlas-round', 'Matte Black / 48mm', 12900, 25, 'VU-ATL-BK-48'),
    ],
  ),
  base('nova-geometric', 'Nova', 'Vuera Studio', 'geometric', 'acetate', 'women', 'single-vision', 20900, null, 4.9, 156,
    'Bold geometric silhouette with sharp angular lines. For those who refuse to blend in.',
    ['optical', 'sunglasses'],
    [
      img('img-nova-1', 'prod-nova-geometric', 'https://images.pexels.com/photos/29301758/pexels-photo-29301758.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Nova geometric sunglasses', 0),
      img('img-nova-2', 'prod-nova-geometric', 'https://images.pexels.com/photos/26100579/pexels-photo-26100579.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Model wearing Nova frames', 1),
      img('img-nova-3', 'prod-nova-geometric', 'https://images.pexels.com/photos/31762856/pexels-photo-31762856.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Nova sunglasses indoor', 2),
    ],
    [
      variant('var-nova-1', 'prod-nova-geometric', 'Champagne / 53mm', 20900, 14, 'VU-NOV-CH-53'),
      variant('var-nova-2', 'prod-nova-geometric', 'Onyx / 53mm', 20900, 9, 'VU-NOV-ON-53'),
    ],
  ),
  base('horizon-square', 'Horizon', 'North Optics', 'square', 'titanium', 'men', 'single-vision', 17900, null, 4.5, 92,
    'Architectural square frame in featherlight titanium. Clean lines for a confident, modern look.',
    ['optical', 'blue-light'],
    [
      img('img-horizon-1', 'prod-horizon-square', 'https://images.pexels.com/photos/19552285/pexels-photo-19552285.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Horizon square frame portrait', 0),
      img('img-horizon-2', 'prod-horizon-square', 'https://images.pexels.com/photos/1743545/pexels-photo-1743545.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Man wearing Horizon frames', 1),
      img('img-horizon-3', 'prod-horizon-square', 'https://images.pexels.com/photos/17065258/pexels-photo-17065258.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Horizon frame close-up', 2),
    ],
    [
      variant('var-horizon-1', 'prod-horizon-square', 'Gunmetal / 54mm', 17900, 20, 'VU-HOR-GM-54'),
      variant('var-horizon-2', 'prod-horizon-square', 'Matte Black / 54mm', 17900, 16, 'VU-HOR-BK-54'),
    ],
  ),
  base('lumina-oval', 'Lumina', 'Vuera Studio', 'oval', 'acetate', 'women', 'single-vision', 13900, 16900, 4.7, 108,
    'Soft oval frame with a gentle keyhole bridge. Universally flattering and impossibly light.',
    ['optical', 'readers'],
    [
      img('img-lumina-1', 'prod-lumina-oval', 'https://images.pexels.com/photos/8473285/pexels-photo-8473285.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Lumina oval frame still life', 0),
      img('img-lumina-2', 'prod-lumina-oval', 'https://images.pexels.com/photos/7860704/pexels-photo-7860704.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Woman wearing Lumina frames', 1),
      img('img-lumina-3', 'prod-lumina-oval', 'https://images.pexels.com/photos/38453638/pexels-photo-38453638.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Lumina frame profile view', 2),
    ],
    [
      variant('var-lumina-1', 'prod-lumina-oval', 'Rose / 51mm', 13900, 28, 'VU-LUM-RS-51'),
      variant('var-lumina-2', 'prod-lumina-oval', 'Matte Black / 51mm', 13900, 19, 'VU-LUM-BK-51'),
      variant('var-lumina-3', 'prod-lumina-oval', 'Tortoise / 51mm', 14900, 11, 'VU-LUM-TT-51'),
    ],
  ),
  base('orbit-rectangular', 'Orbit', 'North Optics', 'rectangular', 'metal', 'men', 'single-vision', 14900, null, 4.3, 54,
    'Slim rectangular frame with a brushed metal finish. Understated and endlessly versatile.',
    ['optical', 'blue-light'],
    [
      img('img-orbit-1', 'prod-orbit-rectangular', 'https://images.pexels.com/photos/16764124/pexels-photo-16764124.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Orbit rectangular frame portrait', 0),
      img('img-orbit-2', 'prod-orbit-rectangular', 'https://images.pexels.com/photos/14228163/pexels-photo-14228163.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Man adjusting Orbit frames', 1),
      img('img-orbit-3', 'prod-orbit-rectangular', 'https://images.pexels.com/photos/5914908/pexels-photo-5914908.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Orbit frame outdoor', 2),
    ],
    [
      variant('var-orbit-1', 'prod-orbit-rectangular', 'Silver / 55mm', 14900, 24, 'VU-ORB-SV-55'),
      variant('var-orbit-2', 'prod-orbit-rectangular', 'Black / 55mm', 14900, 17, 'VU-ORB-BK-55'),
    ],
  ),
  base('eclipse-aviator', 'Eclipse', 'Vuera Studio', 'aviator', 'metal', 'unisex', 'sunglasses', 23900, null, 4.8, 73,
    'Oversized aviator with a double bridge and mirrored lenses. Maximum coverage, maximum impact.',
    ['sunglasses'],
    [
      img('img-eclipse-1', 'prod-eclipse-aviator', 'https://images.pexels.com/photos/38523258/pexels-photo-38523258.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Eclipse aviator sunglasses', 0),
      img('img-eclipse-2', 'prod-eclipse-aviator', 'https://images.pexels.com/photos/18742635/pexels-photo-18742635.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Model wearing Eclipse sunglasses profile', 1),
      img('img-eclipse-3', 'prod-eclipse-aviator', 'https://images.pexels.com/photos/5891808/pexels-photo-5891808.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'Eclipse sunglasses street style', 2),
    ],
    [
      variant('var-eclipse-1', 'prod-eclipse-aviator', 'Gold / Mirror Lens', 23900, 13, 'VU-ECL-GD-MR', 'Mirror'),
      variant('var-eclipse-2', 'prod-eclipse-aviator', 'Black / Smoke Lens', 23900, 9, 'VU-ECL-BK-SM', 'Smoke'),
    ],
  ),
];

export function getFeaturedProducts(): CatalogProduct[] {
  return products.filter((p) => p.rating !== null && p.rating >= 4.6).slice(0, 4);
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(slug: string): CatalogProduct[] {
  return products.filter((p) => p.categorySlugs.includes(slug));
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
