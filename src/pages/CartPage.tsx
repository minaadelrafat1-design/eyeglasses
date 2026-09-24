import { Link, useNavigate } from '@/lib/navigation';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/vui';
import { useCart } from '@/context';
import { formatMoney, cx } from '@/lib/utils';
import { calculateShipping, calculateTax } from '@/services/checkoutService';

export function CartPage() {
  const { items, subtotalCents, updateQuantity, removeItem, count } = useCart();
  const navigate = useNavigate();

  const shippingCents = calculateShipping(subtotalCents);
  const taxCents = calculateTax(subtotalCents);
  const totalCents = subtotalCents + shippingCents + taxCents;

  if (items.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="container-app py-16 md:py-24">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100">
              <ShoppingBag size={36} className="text-ink-400" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">Your cart is empty</h1>
            <p className="mt-2 text-ink-500">
              Looks like you haven't added any frames yet. Browse our collection and find your perfect pair.
            </p>
            <Link to="/shop" className="mt-6">
              <Button size="lg">
                Browse frames
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-app py-8">
          <h1 className="text-3xl font-semibold tracking-tight">Your cart</h1>
          <p className="mt-1 text-ink-500">{count} {count === 1 ? 'item' : 'items'}</p>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="divide-y divide-ink-200 rounded-2xl border border-ink-200 bg-white">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-4 p-5">
                  <Link
                    to={`/product/${item.productId}`}
                    className="shrink-0"
                  >
                    <div className="h-24 w-24 overflow-hidden rounded-xl bg-ink-100">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag size={20} className="text-ink-300" />
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                    to={`/product/${item.productId}`}
                        className="font-medium text-ink-900 hover:text-primary-700"
                      >
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        aria-label="Remove item"
                        className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-error-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-sm text-ink-500">{formatMoney(item.unitPriceCents)} each</p>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-lg border border-ink-300">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-3 py-2 text-ink-600 transition-colors hover:text-ink-900"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-3 py-2 text-ink-600 transition-colors hover:text-ink-900"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-semibold text-ink-900">
                        {formatMoney(item.unitPriceCents * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Link to="/shop" className="text-sm font-medium text-primary-700 hover:text-primary-800">
                ← Continue shopping
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-[calc(var(--header-height)+1rem)] rounded-2xl border border-ink-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Order summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-600">Subtotal</span>
                  <span className="font-medium text-ink-900">{formatMoney(subtotalCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Shipping</span>
                  <span className="font-medium text-ink-900">
                    {shippingCents === 0 ? 'Free' : formatMoney(shippingCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Estimated tax</span>
                  <span className="font-medium text-ink-900">{formatMoney(taxCents)}</span>
                </div>
                {shippingCents > 0 && (
                  <p className="rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-700">
                    Add {formatMoney(15000 - subtotalCents)} more for free shipping
                  </p>
                )}
                <div className="border-t border-ink-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-ink-900">Total</span>
                    <span className="text-xl font-semibold text-ink-900">{formatMoney(totalCents)}</span>
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                fullWidth
                className="mt-6"
                onClick={() => navigate('/checkout')}
              >
                Proceed to checkout
                <ArrowRight size={18} />
              </Button>
              <p className="mt-3 text-center text-xs text-ink-400">
                Secure checkout — your payment information is encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
