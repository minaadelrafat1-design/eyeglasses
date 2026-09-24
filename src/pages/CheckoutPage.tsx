import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from '@/lib/navigation';
import { ArrowRight, Lock, Check, AlertCircle } from 'lucide-react';
import { Button, Input, Spinner, Badge } from '@/components/vui';
import { useCart, useAuth } from '@/context';
import { formatMoney } from '@/lib/utils';
import { calculateShipping, calculateTax, createOrder } from '@/services/checkoutService';
import { fetchAddresses, type SavedAddress } from '@/services/addressService';
import type { Address, Order } from '@/types';

type CheckoutStep = 'information' | 'shipping' | 'payment';

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: 'information', label: 'Information' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'payment', label: 'Payment' },
];

function emptyAddress(): Address {
  return {
    fullName: '',
    line1: '',
    line2: null,
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    phone: null,
  };
}

export function CheckoutPage() {
  const { items, subtotalCents, clear } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<CheckoutStep>('information');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState<Address>(emptyAddress());
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Prefill from profile
  useEffect(() => {
    if (profile) {
      setEmail(profile.email);
      setAddress((prev) => ({
        ...prev,
        fullName: [profile.firstName, profile.lastName].filter(Boolean).join(' '),
      }));
    }
  }, [profile]);

  // Load saved addresses
  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoadingAddresses(true);
    fetchAddresses(user.id)
      .then((addrs) => {
        if (!active) return;
        setSavedAddresses(addrs);
        const defaultAddr = addrs.find((a) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setAddress(defaultAddr);
        }
      })
      .catch(() => { /* non-fatal */ })
      .finally(() => { if (active) setLoadingAddresses(false); });
    return () => { active = false; };
  }, [user]);

  const shippingCents = calculateShipping(subtotalCents);
  const taxCents = calculateTax(subtotalCents);
  const totalCents = subtotalCents + shippingCents + taxCents;

  const stepIndex = useMemo(() => STEPS.findIndex((s) => s.key === step), [step]);

  function validateInformation(): boolean {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email';
    if (!address.fullName.trim()) errors.fullName = 'Full name is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateShipping(): boolean {
    const errors: Record<string, string> = {};
    if (!address.line1.trim()) errors.line1 = 'Address is required';
    if (!address.city.trim()) errors.city = 'City is required';
    if (!address.state.trim()) errors.state = 'State is required';
    if (!address.postalCode.trim()) errors.postalCode = 'ZIP code is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSelectSavedAddress(addr: SavedAddress) {
    setSelectedAddressId(addr.id);
    setAddress(addr);
    setFieldErrors({});
  }

  function handleContinue() {
    setError(null);
    if (step === 'information') {
      if (validateInformation()) setStep('shipping');
    } else if (step === 'shipping') {
      if (validateShipping()) setStep('payment');
    }
  }

  async function handlePlaceOrder() {
    setError(null);
    setPlacing(true);
    try {
      const order: Order = await createOrder({
        items,
        shippingAddress: address,
        customerEmail: email,
        shippingCents,
        taxCents,
      });
      clear();
      navigate(`/order/${order.id}`, { state: { justPlaced: true } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong placing your order';
      setError(message);
    } finally {
      setPlacing(false);
    }
  }

  // Empty cart guard
  if (items.length === 0 && !placing) {
    return (
      <div className="animate-fade-in">
        <div className="container-app py-16 md:py-24">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100">
              <AlertCircle size={36} className="text-ink-400" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">Your cart is empty</h1>
            <p className="mt-2 text-ink-500">Add some frames before checking out.</p>
            <Link to="/shop" className="mt-6">
              <Button size="lg">Browse frames</Button>
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
          <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ' +
                    (idx <= stepIndex
                      ? 'bg-primary-600 text-white'
                      : 'bg-ink-100 text-ink-400')
                  }
                >
                  {idx < stepIndex ? <Check size={14} /> : idx + 1}
                </div>
                <span
                  className={
                    'text-sm font-medium ' +
                    (idx <= stepIndex ? 'text-ink-900' : 'text-ink-400')
                  }
                >
                  {s.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <div className="mx-1 h-px w-8 bg-ink-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form area */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-error-300 bg-error-50 p-4">
                <AlertCircle size={20} className="mt-0.5 shrink-0 text-error-600" />
                <div>
                  <p className="font-medium text-error-800">Order could not be placed</p>
                  <p className="mt-0.5 text-sm text-error-700">{error}</p>
                </div>
              </div>
            )}

            {/* Saved addresses */}
            {step === 'information' && savedAddresses.length > 0 && (
              <div className="mb-6 rounded-2xl border border-ink-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-ink-900">Saved addresses</h3>
                <div className="mt-3 space-y-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={
                        'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ' +
                        (selectedAddressId === addr.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-ink-200 hover:border-ink-300')
                      }
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink-900">{addr.fullName}</p>
                        <p className="text-sm text-ink-500">
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                      </div>
                      {addr.isDefault && <Badge variant="neutral">Default</Badge>}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink-500">Or enter a new address below.</p>
              </div>
            )}

            {/* Step: Information */}
            {step === 'information' && (
              <div className="rounded-2xl border border-ink-200 bg-white p-6">
                <h2 className="text-lg font-semibold">Contact information</h2>
                <div className="mt-4 space-y-4">
                  <Input
                    label="Email address"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={fieldErrors.email}
                    placeholder="you@example.com"
                  />
                  <Input
                    label="Full name"
                    name="fullName"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    error={fieldErrors.fullName}
                    placeholder="Jane Doe"
                  />
                  <Input
                    label="Phone (optional)"
                    name="phone"
                    value={address.phone ?? ''}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value || null })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <Button size="lg" fullWidth className="mt-6" onClick={handleContinue}>
                  Continue to shipping
                  <ArrowRight size={18} />
                </Button>
              </div>
            )}

            {/* Step: Shipping */}
            {step === 'shipping' && (
              <div className="rounded-2xl border border-ink-200 bg-white p-6">
                <h2 className="text-lg font-semibold">Shipping address</h2>
                <div className="mt-4 space-y-4">
                  <Input
                    label="Street address"
                    name="line1"
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                    error={fieldErrors.line1}
                    placeholder="123 Main Street"
                  />
                  <Input
                    label="Apartment, suite, etc. (optional)"
                    name="line2"
                    value={address.line2 ?? ''}
                    onChange={(e) => setAddress({ ...address, line2: e.target.value || null })}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="City"
                      name="city"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      error={fieldErrors.city}
                    />
                    <Input
                      label="State / Province"
                      name="state"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      error={fieldErrors.state}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="ZIP / Postal code"
                      name="postalCode"
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      error={fieldErrors.postalCode}
                    />
                    <Input
                      label="Country"
                      name="country"
                      value={address.country}
                      onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep('information')}>
                    Back
                  </Button>
                  <Button size="lg" fullWidth onClick={handleContinue}>
                    Continue to payment
                    <ArrowRight size={18} />
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Payment */}
            {step === 'payment' && (
              <div className="rounded-2xl border border-ink-200 bg-white p-6">
                <h2 className="text-lg font-semibold">Payment</h2>
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-ink-300 bg-ink-50 p-4">
                  <Lock size={20} className="shrink-0 text-ink-500" />
                  <div>
                    <p className="text-sm font-medium text-ink-800">Payment gateway coming soon</p>
                    <p className="text-sm text-ink-500">
                      Your order will be created in "pending" status. When the payment integration is live,
                      you'll be able to pay with a card right here.
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-primary-50 p-4">
                  <p className="text-sm font-medium text-primary-800">
                    Test mode — place order
                  </p>
                  <p className="mt-1 text-sm text-primary-700">
                    No payment will be charged. You'll receive an order confirmation and can track its status from your account.
                  </p>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button variant="outline" size="lg" onClick={() => setStep('shipping')}>
                    Back
                  </Button>
                  <Button
                    size="lg"
                    fullWidth
                    isLoading={placing}
                    onClick={handlePlaceOrder}
                    disabled={placing}
                  >
                    {placing ? 'Placing order…' : `Place order — ${formatMoney(totalCents)}`}
                  </Button>
                </div>
              </div>
            )}

            {loadingAddresses && (
              <div className="mt-4 flex justify-center">
                <Spinner size={20} />
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-[calc(var(--header-height)+1rem)] rounded-2xl border border-ink-200 bg-white p-6">
              <h2 className="text-lg font-semibold">Order summary</h2>
              <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-ink-900 line-clamp-1">{item.name}</p>
                      <p className="text-ink-500">Qty {item.quantity} · {formatMoney(item.unitPriceCents)}</p>
                    </div>
                    <span className="text-sm font-medium text-ink-900">
                      {formatMoney(item.unitPriceCents * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-3 border-t border-ink-200 pt-4 text-sm">
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
                  <span className="text-ink-600">Tax</span>
                  <span className="font-medium text-ink-900">{formatMoney(taxCents)}</span>
                </div>
                <div className="border-t border-ink-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-ink-900">Total</span>
                    <span className="text-xl font-semibold text-ink-900">{formatMoney(totalCents)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
