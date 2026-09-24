import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ApiError } from "@/types";
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
  Order,
  OrderStatus,
  UserProfile,
} from "@/types";

/**
 * Admin service — all staff/admin operations go through here.
 * Reads use the Supabase anon client (gated by RLS + is_staff());
 * privileged writes (orders, profiles) use SECURITY DEFINER RPCs.
 */

export interface DashboardSummary {
  totalSalesCents: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockVariants: number;
  pendingOrders: number;
}

export interface BestSeller {
  productId: string;
  productName: string;
  unitsSold: number;
  revenueCents: number;
}

export interface LowStockItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  stock: number;
  priceCents: number;
}

export interface RevenuePoint {
  day: string;
  revenueCents: number;
  orderCount: number;
}

export interface RecentOrder {
  orderId: string;
  customerEmail: string;
  status: string;
  totalCents: number;
  itemCount: number;
  createdAt: string;
}

export interface CustomerActivity {
  orderCount: number;
  totalSpentCents: number;
  reviewCount: number;
  wishlistCount: number;
  hasPreferences: boolean;
}

export type { Order, OrderStatus, UserProfile } from "@/types";

export type AdminProduct = Product;

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
  images: {
    id: string;
    url: string;
    alt_text: string | null;
    position: number;
    is_ai_generated: boolean;
  }[];
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

function mapRow(row: ProductRow, categorySlugById: Map<string, string>): AdminProduct {
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
    shape: (row.shape?.slug as Product["shape"]) ?? null,
    materialId: row.material_id,
    material: (row.material?.slug as Product["material"]) ?? null,
    gender: row.gender as Product["gender"],
    lensType: row.lens_type as Product["lensType"],
    priceCents: row.price_cents,
    compareAtPriceCents: row.compare_at_price_cents,
    status: row.status as Product["status"],
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
  const { data } = await supabase.from("categories").select("id, slug");
  return new Map((data ?? []).map((c) => [c.id, c.slug]));
}

const PRODUCT_SELECT = `*, brand:brands(slug, name), shape:frame_shapes(slug, name),
  material:materials(slug, name),
  images:product_images(*), variants:product_variants(*),
  product_categories(category_id)`;

// ============================================================
// Dashboard analytics
// ============================================================

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  if (!isSupabaseConfigured) {
    return {
      totalSalesCents: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalProducts: 0,
      lowStockVariants: 0,
      pendingOrders: 0,
    };
  }

  const { data, error } = await supabase.rpc("admin_dashboard_summary");
  if (error) throw new ApiError(error.message, 500, error.code);
  const row = (data ?? []) as Array<Record<string, number>>;
  const r = row[0] ?? {};
  return {
    totalSalesCents: Number(r.total_sales_cents ?? 0),
    totalOrders: Number(r.total_orders ?? 0),
    totalCustomers: Number(r.total_customers ?? 0),
    totalProducts: Number(r.total_products ?? 0),
    lowStockVariants: Number(r.low_stock_variants ?? 0),
    pendingOrders: Number(r.pending_orders ?? 0),
  };
}

export async function fetchBestSellers(limit = 5): Promise<BestSeller[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("admin_best_sellers", { p_limit: limit });
  if (error) throw new ApiError(error.message, 500, error.code);
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    productId: String(r.product_id),
    productName: String(r.product_name),
    unitsSold: Number(r.units_sold),
    revenueCents: Number(r.revenue_cents),
  }));
}

export async function fetchLowStock(threshold = 10): Promise<LowStockItem[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("admin_low_stock", { p_threshold: threshold });
  if (error) throw new ApiError(error.message, 500, error.code);
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    variantId: String(r.variant_id),
    productId: String(r.product_id),
    productName: String(r.product_name),
    variantName: String(r.variant_name),
    sku: String(r.sku),
    stock: Number(r.stock),
    priceCents: Number(r.price_cents),
  }));
}

export async function fetchRevenueByDay(days = 30): Promise<RevenuePoint[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("admin_revenue_by_day", { p_days: days });
  if (error) throw new ApiError(error.message, 500, error.code);
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    day: String(r.day),
    revenueCents: Number(r.revenue_cents),
    orderCount: Number(r.order_count),
  }));
}

export async function fetchRecentOrders(limit = 10): Promise<RecentOrder[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("admin_recent_orders", { p_limit: limit });
  if (error) throw new ApiError(error.message, 500, error.code);
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    orderId: String(r.order_id),
    customerEmail: String(r.customer_email ?? ""),
    status: String(r.status),
    totalCents: Number(r.total_cents),
    itemCount: Number(r.item_count),
    createdAt: String(r.created_at),
  }));
}

// ============================================================
// Product management
// ============================================================

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(error.message, 500, error.code);
  const categoryMap = await loadCategoryMap();
  return (data ?? []).map((row) => mapRow(row as unknown as ProductRow, categoryMap));
}

export async function fetchAdminProductBySlug(slug: string): Promise<AdminProduct | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new ApiError(error.message, 500, error.code);
  if (!data) return null;
  const categoryMap = await loadCategoryMap();
  return mapRow(data as unknown as ProductRow, categoryMap);
}

export interface ProductInput {
  slug: string;
  name: string;
  brandId: string | null;
  description: string | null;
  shapeId: string | null;
  materialId: string | null;
  gender: string;
  lensType: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  status: string;
  categoryIds: string[];
  images: { url: string; altText: string | null; position: number }[];
  variants: {
    id?: string;
    colorId: string | null;
    sizeId: string | null;
    name: string;
    lensTint: string | null;
    priceCents: number;
    stock: number;
    sku: string;
  }[];
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  if (!isSupabaseConfigured) throw new ApiError("Database not configured", 503, "DB_OFFLINE");

  const { data: product, error: pErr } = await supabase
    .from("products")
    .insert({
      slug: input.slug,
      name: input.name,
      brand_id: input.brandId,
      description: input.description,
      shape_id: input.shapeId,
      material_id: input.materialId,
      gender: input.gender,
      lens_type: input.lensType,
      price_cents: input.priceCents,
      compare_at_price_cents: input.compareAtPriceCents,
      status: input.status,
    })
    .select()
    .single();
  if (pErr) throw new ApiError(pErr.message, 500, pErr.code);

  const productId = product.id;

  if (input.images.length) {
    const { error: imgErr } = await supabase.from("product_images").insert(
      input.images.map((img, i) => ({
        product_id: productId,
        url: img.url,
        alt_text: img.altText,
        position: img.position ?? i,
      })),
    );
    if (imgErr) throw new ApiError(imgErr.message, 500, imgErr.code);
  }

  if (input.variants.length) {
    const { error: vErr } = await supabase.from("product_variants").insert(
      input.variants.map((v) => ({
        product_id: productId,
        color_id: v.colorId,
        size_id: v.sizeId,
        name: v.name,
        lens_tint: v.lensTint,
        price_cents: v.priceCents,
        stock: v.stock,
        sku: v.sku,
      })),
    );
    if (vErr) throw new ApiError(vErr.message, 500, vErr.code);
  }

  if (input.categoryIds.length) {
    const { error: cErr } = await supabase
      .from("product_categories")
      .insert(input.categoryIds.map((cid) => ({ product_id: productId, category_id: cid })));
    if (cErr) throw new ApiError(cErr.message, 500, cErr.code);
  }

  return (await fetchAdminProductBySlug(input.slug))!;
}

export async function updateProduct(
  productId: string,
  input: Partial<ProductInput>,
): Promise<AdminProduct> {
  if (!isSupabaseConfigured) throw new ApiError("Database not configured", 503, "DB_OFFLINE");

  const updates: Record<string, unknown> = {};
  if (input.slug !== undefined) updates.slug = input.slug;
  if (input.name !== undefined) updates.name = input.name;
  if (input.brandId !== undefined) updates.brand_id = input.brandId;
  if (input.description !== undefined) updates.description = input.description;
  if (input.shapeId !== undefined) updates.shape_id = input.shapeId;
  if (input.materialId !== undefined) updates.material_id = input.materialId;
  if (input.gender !== undefined) updates.gender = input.gender;
  if (input.lensType !== undefined) updates.lens_type = input.lensType;
  if (input.priceCents !== undefined) updates.price_cents = input.priceCents;
  if (input.compareAtPriceCents !== undefined)
    updates.compare_at_price_cents = input.compareAtPriceCents;
  if (input.status !== undefined) updates.status = input.status;

  if (Object.keys(updates).length) {
    const { error } = await supabase
      .from("products")
      .update(updates as never)
      .eq("id", productId);
    if (error) throw new ApiError(error.message, 500, error.code);
  }

  if (input.images !== undefined) {
    await supabase.from("product_images").delete().eq("product_id", productId);
    if (input.images.length) {
      const { error } = await supabase.from("product_images").insert(
        input.images.map((img, i) => ({
          product_id: productId,
          url: img.url,
          alt_text: img.altText,
          position: img.position ?? i,
        })),
      );
      if (error) throw new ApiError(error.message, 500, error.code);
    }
  }

  if (input.variants !== undefined) {
    const existingIds = input.variants.filter((v) => v.id).map((v) => v.id) as string[];
    if (existingIds.length) {
      await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", productId)
        .not("id", "in", `(${existingIds.join(",")})`);
    } else {
      await supabase.from("product_variants").delete().eq("product_id", productId);
    }
    for (const v of input.variants) {
      if (v.id) {
        const { error } = await supabase
          .from("product_variants")
          .update({
            color_id: v.colorId,
            size_id: v.sizeId,
            name: v.name,
            lens_tint: v.lensTint,
            price_cents: v.priceCents,
            stock: v.stock,
            sku: v.sku,
          })
          .eq("id", v.id);
        if (error) throw new ApiError(error.message, 500, error.code);
      } else {
        const { error } = await supabase.from("product_variants").insert({
          product_id: productId,
          color_id: v.colorId,
          size_id: v.sizeId,
          name: v.name,
          lens_tint: v.lensTint,
          price_cents: v.priceCents,
          stock: v.stock,
          sku: v.sku,
        });
        if (error) throw new ApiError(error.message, 500, error.code);
      }
    }
  }

  if (input.categoryIds !== undefined) {
    await supabase.from("product_categories").delete().eq("product_id", productId);
    if (input.categoryIds.length) {
      const { error } = await supabase
        .from("product_categories")
        .insert(input.categoryIds.map((cid) => ({ product_id: productId, category_id: cid })));
      if (error) throw new ApiError(error.message, 500, error.code);
    }
  }

  const updated = await fetchAdminProductBySlug(input.slug ?? "");
  return updated ?? (await fetchAdminProductById(productId))!;
}

async function fetchAdminProductById(id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new ApiError(error.message, 500, error.code);
  if (!data) return null;
  const categoryMap = await loadCategoryMap();
  return mapRow(data as unknown as ProductRow, categoryMap);
}

export async function deleteProduct(productId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new ApiError(error.message, 500, error.code);
}

// ============================================================
// Attribute management
// ============================================================

export async function fetchAdminBrands(): Promise<Brand[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("brands").select("*").order("name");
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []) as unknown as Brand[];
}

export async function createBrand(
  name: string,
  slug: string,
  description?: string,
): Promise<Brand> {
  const { data, error } = await supabase
    .from("brands")
    .insert({ name, slug, description })
    .select()
    .single();
  if (error) throw new ApiError(error.message, 500, error.code);
  return data as unknown as Brand;
}

export async function deleteBrand(id: string): Promise<void> {
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) throw new ApiError(error.message, 500, error.code);
}

export async function fetchAdminCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []) as unknown as Category[];
}

export async function createCategory(
  slug: string,
  name: string,
  description?: string,
): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ slug, name, description })
    .select()
    .single();
  if (error) throw new ApiError(error.message, 500, error.code);
  return data as unknown as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new ApiError(error.message, 500, error.code);
}

export async function fetchAdminColors(): Promise<Color[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("colors").select("*").order("name");
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []) as unknown as Color[];
}

export async function createColor(name: string, slug: string, hexCode?: string): Promise<Color> {
  const { data, error } = await supabase
    .from("colors")
    .insert({ name, slug, hex_code: hexCode })
    .select()
    .single();
  if (error) throw new ApiError(error.message, 500, error.code);
  return data as unknown as Color;
}

export async function deleteColor(id: string): Promise<void> {
  const { error } = await supabase.from("colors").delete().eq("id", id);
  if (error) throw new ApiError(error.message, 500, error.code);
}

export async function fetchAdminFrameShapes(): Promise<FrameShapeOption[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("frame_shapes").select("*").order("name");
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []) as unknown as FrameShapeOption[];
}

export async function createFrameShape(slug: string, name: string): Promise<FrameShapeOption> {
  const { data, error } = await supabase
    .from("frame_shapes")
    .insert({ slug, name })
    .select()
    .single();
  if (error) throw new ApiError(error.message, 500, error.code);
  return data as unknown as FrameShapeOption;
}

export async function deleteFrameShape(id: string): Promise<void> {
  const { error } = await supabase.from("frame_shapes").delete().eq("id", id);
  if (error) throw new ApiError(error.message, 500, error.code);
}

export async function fetchAdminMaterials(): Promise<MaterialOption[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("materials").select("*").order("name");
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []) as unknown as MaterialOption[];
}

export async function createMaterial(slug: string, name: string): Promise<MaterialOption> {
  const { data, error } = await supabase.from("materials").insert({ slug, name }).select().single();
  if (error) throw new ApiError(error.message, 500, error.code);
  return data as unknown as MaterialOption;
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) throw new ApiError(error.message, 500, error.code);
}

export async function fetchAdminSizes(): Promise<SizeOption[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("sizes").select("*").order("size_mm");
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []) as unknown as SizeOption[];
}

export async function createSize(sizeMm: number, label: string): Promise<SizeOption> {
  const { data, error } = await supabase
    .from("sizes")
    .insert({ size_mm: sizeMm, label })
    .select()
    .single();
  if (error) throw new ApiError(error.message, 500, error.code);
  return data as unknown as SizeOption;
}

export async function deleteSize(id: string): Promise<void> {
  const { error } = await supabase.from("sizes").delete().eq("id", id);
  if (error) throw new ApiError(error.message, 500, error.code);
}

// ============================================================
// Order management
// ============================================================

interface OrderRow {
  id: string;
  user_id: string;
  status: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  shipping_address: unknown;
  created_at: string;
  updated_at: string;
  order_items: {
    id: string;
    order_id: string;
    product_id: string | null;
    variant_id: string | null;
    product_name: string;
    variant_name: string;
    unit_price_cents: number;
    quantity: number;
  }[];
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status as OrderStatus,
    subtotalCents: row.subtotal_cents,
    shippingCents: row.shipping_cents,
    taxCents: row.tax_cents,
    totalCents: row.total_cents,
    currency: row.currency,
    shippingAddress: (row.shipping_address as Order["shippingAddress"]) ?? null,
    items: (row.order_items ?? []).map((oi) => ({
      id: oi.id,
      orderId: oi.order_id,
      productId: oi.product_id,
      variantId: oi.variant_id,
      productName: oi.product_name,
      variantName: oi.variant_name,
      unitPriceCents: oi.unit_price_cents,
      quantity: oi.quantity,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchAdminOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []).map((row) => mapOrder(row as unknown as OrderRow));
}

export async function fetchAdminOrderById(orderId: string): Promise<Order | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new ApiError(error.message, 500, error.code);
  if (!data) return null;
  return mapOrder(data as unknown as OrderRow);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw new ApiError(error.message, 500, error.code);
}

// ============================================================
// Customer management
// ============================================================

interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role as UserProfile["role"],
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchAdminCustomers(): Promise<UserProfile[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []).map((row) => mapProfile(row as unknown as ProfileRow));
}

export async function fetchAdminCustomerById(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new ApiError(error.message, 500, error.code);
  if (!data) return null;
  return mapProfile(data as unknown as ProfileRow);
}

export async function fetchCustomerActivity(userId: string): Promise<CustomerActivity> {
  if (!isSupabaseConfigured) {
    return {
      orderCount: 0,
      totalSpentCents: 0,
      reviewCount: 0,
      wishlistCount: 0,
      hasPreferences: false,
    };
  }
  const { data, error } = await supabase.rpc("admin_customer_activity", { p_user_id: userId });
  if (error) throw new ApiError(error.message, 500, error.code);
  const row = (data ?? []) as Array<Record<string, unknown>>;
  const r = row[0] ?? {};
  return {
    orderCount: Number(r.order_count ?? 0),
    totalSpentCents: Number(r.total_spent_cents ?? 0),
    reviewCount: Number(r.review_count ?? 0),
    wishlistCount: Number(r.wishlist_count ?? 0),
    hasPreferences: Boolean(r.has_preferences),
  };
}

export async function fetchCustomerOrders(userId: string): Promise<Order[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new ApiError(error.message, 500, error.code);
  return (data ?? []).map((row) => mapOrder(row as unknown as OrderRow));
}

export async function updateCustomerRole(userId: string, role: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.rpc("admin_update_profile_role", {
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw new ApiError(error.message, 500, error.code);
}

// ============================================================
// Image upload
// ============================================================

export async function uploadProductImage(file: File, productId: string): Promise<string> {
  if (!isSupabaseConfigured) throw new ApiError("Storage not configured", 503, "STORAGE_OFFLINE");

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `products/${productId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false });
  if (error)
    throw new ApiError(error.message, 500, (error as { code?: string }).code ?? "STORAGE_ERROR");

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
