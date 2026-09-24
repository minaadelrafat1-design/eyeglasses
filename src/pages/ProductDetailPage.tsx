import { useEffect, useState } from "react";
import { Link, useParams } from "@/lib/navigation";
import {
  Heart,
  Scan,
  ShoppingBag,
  Star,
  Truck,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  GitCompare,
} from "lucide-react";
import { Button, Badge, Spinner } from "@/components/vui";
import {
  RatingStars,
  ProductCard,
  ImageGallery,
  SizeGuide,
  MaterialInfo,
  RecentlyViewedProducts,
} from "@/components/shared";
import { TryOnModal } from "@/components/tryon";
import { useCart, useWishlist, useCompare, useRecentlyViewed, useAssistant } from "@/context";
import { fetchProductBySlug, fetchSimilarProducts } from "@/services/productService";
import { featureFlags } from "@/lib/featureFlags";
import { formatMoney, cx } from "@/lib/utils";
import type { Product } from "@/types";

export function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const { has: hasCompare, toggle: toggleCompare, isFull } = useCompare();
  const { add: addRecentlyViewed } = useRecentlyViewed();
  const { setPageContext } = useAssistant();

  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [tryOnOpen, setTryOnOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setProduct(undefined);
    fetchProductBySlug(slug).then((p) => {
      if (active) setProduct(p);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (product) addRecentlyViewed(product.id);
  }, [product, addRecentlyViewed]);

  useEffect(() => {
    if (!product) {
      setRelated([]);
      return;
    }
    let active = true;
    fetchSimilarProducts(product).then((items) => {
      if (active) setRelated(items);
    });
    return () => {
      active = false;
    };
  }, [product]);

  // Let the advisor know which frame is on screen.
  useEffect(() => {
    setPageContext({ currentProductSlug: product?.slug ?? null });
    return () => setPageContext({ currentProductSlug: null });
  }, [product, setPageContext]);

  if (product === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-app py-24 text-center">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <Link to="/shop" className="mt-4 inline-block">
          <Button>Back to shop</Button>
        </Link>
      </div>
    );
  }

  const isWishlisted = has(product.id);
  const isComparing = hasCompare(product.id);
  const onSale =
    product.compareAtPriceCents !== null && product.compareAtPriceCents < product.priceCents;
  const variant = product.variants[selectedVariant] ?? product.variants[0];

  const handleAddToCart = () => {
    if (!variant) return;
    addItem({
      productId: product.id,
      variantId: variant.id,
      name: `${product.name} — ${variant.name}`,
      image: product.images[0]?.url ?? "",
      unitPriceCents: variant.priceCents,
      quantity,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const specs = [
    {
      label: "Shape",
      value: product.shape ? product.shape.charAt(0).toUpperCase() + product.shape.slice(1) : "—",
    },
    {
      label: "Material",
      value: product.material
        ? product.material.charAt(0).toUpperCase() + product.material.slice(1)
        : "—",
    },
    { label: "Gender", value: product.gender.charAt(0).toUpperCase() + product.gender.slice(1) },
    {
      label: "Lens Type",
      value: product.lensType.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    },
    { label: "SKU", value: variant?.sku ?? "—" },
  ];

  return (
    <div className="animate-fade-in pb-24">
      {/* Breadcrumb */}
      <div className="border-b border-ink-200 bg-white">
        <div className="container-app py-4">
          <nav className="flex items-center gap-1.5 text-sm text-ink-500">
            <Link to="/" className="hover:text-ink-700">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link to="/shop" className="hover:text-ink-700">
              Shop
            </Link>
            <ChevronRight size={14} />
            <span className="text-ink-800">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-app py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          {/* Gallery */}
          <ImageGallery images={product.images} productName={product.name} />

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium uppercase tracking-wide text-ink-500">
                {product.brandName ?? "Vuera"}
              </span>
              {onSale && <Badge variant="error">Sale</Badge>}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-3">
              <RatingStars
                rating={product.rating ?? 0}
                size={16}
                showValue
                count={product.reviewCount}
              />
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-2xl font-semibold text-ink-900">
                {formatMoney(variant?.priceCents ?? product.priceCents)}
              </span>
              {onSale && (
                <span className="text-lg text-ink-400 line-through">
                  {formatMoney(product.compareAtPriceCents!)}
                </span>
              )}
            </div>

            <p className="mt-5 text-ink-600 text-pretty">{product.description}</p>

            {/* Color / variant options */}
            {product.variants.length > 1 && (
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink-900">
                    Color: <span className="font-normal text-ink-600">{variant?.name}</span>
                  </h3>
                  <SizeGuide />
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, idx) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(idx)}
                      className={cx(
                        "rounded-lg border px-4 py-2.5 text-sm transition-colors",
                        selectedVariant === idx
                          ? "border-primary-600 bg-primary-50 text-primary-800"
                          : "border-ink-300 bg-white text-ink-700 hover:border-ink-400",
                      )}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.variants.length <= 1 && (
              <div className="mt-8">
                <SizeGuide />
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-ink-300">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 text-ink-600 hover:text-ink-900"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-2.5 text-ink-600 hover:text-ink-900"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <Button
                size="lg"
                fullWidth
                onClick={handleAddToCart}
                className="flex-1"
                disabled={!variant}
              >
                <ShoppingBag size={18} />
                {addedToCart ? "Added!" : "Add to cart"}
              </Button>
            </div>

            {/* Compare + Try On + Wishlist */}
            <div className="mt-3 flex gap-3">
              {featureFlags.virtualTryOn && (
                <Button size="lg" variant="outline" fullWidth onClick={() => setTryOnOpen(true)}>
                  <Scan size={18} />
                  Try On
                </Button>
              )}
              <button
                onClick={() => toggleCompare(product.id)}
                disabled={!isComparing && isFull}
                aria-label={isComparing ? "Remove from comparison" : "Add to comparison"}
                aria-pressed={isComparing}
                className={cx(
                  "flex h-11 w-12 items-center justify-center rounded-lg border transition-colors",
                  isComparing
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-ink-300 bg-white text-ink-600 hover:border-ink-400 disabled:opacity-30 disabled:cursor-not-allowed",
                )}
              >
                <GitCompare size={18} />
              </button>
              <button
                onClick={() => toggle(product.id)}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={cx(
                  "flex h-11 w-12 items-center justify-center rounded-lg border transition-colors",
                  isWishlisted
                    ? "border-error-300 bg-error-50 text-error-500"
                    : "border-ink-300 bg-white text-ink-600 hover:border-ink-400",
                )}
              >
                <Heart size={18} className={cx(isWishlisted && "fill-error-500")} />
              </button>
            </div>

            {/* Service badges */}
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-ink-200 pt-6">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Truck size={20} className="text-ink-500" />
                <span className="text-xs text-ink-600">Free shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <RefreshCw size={20} className="text-ink-500" />
                <span className="text-xs text-ink-600">30-day returns</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <ShieldCheck size={20} className="text-ink-500" />
                <span className="text-xs text-ink-600">2-year warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Frame details */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">Frame details</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {specs.map((spec) => (
              <div key={spec.label} className="rounded-xl border border-ink-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-ink-400">{spec.label}</p>
                <p className="mt-1 text-sm font-medium capitalize text-ink-900">{spec.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Material info */}
        <div className="mt-8">
          <MaterialInfo material={product.material} />
        </div>

        {/* Reviews placeholder */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">Reviews</h2>
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 py-16 text-center">
            <div className="flex items-center gap-2">
              <Star size={20} className="text-accent-500 fill-accent-500" />
              <span className="text-lg font-semibold text-ink-700">
                {product.rating?.toFixed(1)} · {product.reviewCount} reviews
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-500">
              Reviews will be displayed here in the next phase.
            </p>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold tracking-tight">You may also like</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Recently viewed */}
        <div className="mt-16">
          <RecentlyViewedProducts excludeId={product.id} />
        </div>
      </div>

      {featureFlags.virtualTryOn && (
        <TryOnModal
          open={tryOnOpen}
          onClose={() => setTryOnOpen(false)}
          product={product}
          variant={variant ?? null}
        />
      )}
    </div>
  );
}
