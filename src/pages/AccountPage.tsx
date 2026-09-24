import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@/lib/navigation';
import {
  Package, LogOut, User, Save, MapPin, Plus, Trash2, Check,
} from 'lucide-react';
import { Button, Input, Spinner, Badge, Modal } from '@/components/vui';
import { useAuth } from '@/context';
import { fetchUserOrders, orderStatusToLabel } from '@/services/orderService';
import {
  fetchAddresses, createAddress, deleteAddress,
  type SavedAddress,
} from '@/services/addressService';
import { formatMoney, cx } from '@/lib/utils';
import type { Order, Address } from '@/types';

type Tab = 'profile' | 'orders' | 'addresses';

function emptyAddress(): Address {
  return {
    fullName: '', line1: '', line2: null, city: '', state: '',
    postalCode: '', country: 'US', phone: null,
  };
}

export function AccountPage() {
  const { profile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [addrForm, setAddrForm] = useState<Address>(emptyAddress());
  const [addrLabel, setAddrLabel] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName ?? '');
      setLastName(profile.lastName ?? '');
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    setLoadingOrders(true);
    fetchUserOrders(profile.id)
      .then((o) => { if (active) setOrders(o); })
      .catch(() => { if (active) setOrders([]); })
      .finally(() => { if (active) setLoadingOrders(false); });
    return () => { active = false; };
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    setLoadingAddresses(true);
    fetchAddresses(profile.id)
      .then((a) => { if (active) setAddresses(a); })
      .catch(() => { if (active) setAddresses([]); })
      .finally(() => { if (active) setLoadingAddresses(false); });
    return () => { active = false; };
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({ firstName, lastName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingAddr(true);
    try {
      const newAddr = await createAddress(profile.id, {
        ...addrForm,
        label: addrLabel || null,
        isDefault: addrIsDefault,
      });
      setAddresses((prev) => {
        const rest = addrIsDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
        return [newAddr, ...rest];
      });
      setShowAddrModal(false);
      setAddrForm(emptyAddress());
      setAddrLabel('');
      setAddrIsDefault(false);
    } catch {
      // non-fatal
    } finally {
      setSavingAddr(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!profile) return;
    try {
      await deleteAddress(profile.id, addressId);
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
    } catch {
      // non-fatal
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'orders', label: 'Orders', icon: Package },
    { key: 'addresses', label: 'Addresses', icon: MapPin },
  ];

  return (
    <div className="animate-fade-in">
      <div className="border-b border-ink-200 bg-white">
        <div className="container-app py-10">
          <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
          <p className="mt-1 text-ink-500">Manage your profile, orders, and addresses.</p>
        </div>
      </div>

      <div className="container-app py-8">
        <div className="mb-8 flex gap-1 border-b border-ink-200">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cx(
                  'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  tab === t.key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-ink-500 hover:text-ink-800',
                )}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'profile' && (
          <div className="max-w-lg">
            <div className="rounded-2xl border border-ink-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <User size={24} />
                </div>
                <div>
                  <p className="font-semibold text-ink-900">
                    {profile.firstName} {profile.lastName}
                  </p>
                  <p className="text-sm text-ink-500">{profile.email}</p>
                </div>
              </div>

              <Badge variant="neutral" className="mb-4 capitalize">{profile.role}</Badge>

              <form onSubmit={handleSave} className="space-y-4">
                <Input
                  label="First name"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                />
                <Input
                  label="Last name"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
                <Button type="submit" size="sm" isLoading={saving} disabled={saving}>
                  <Save size={16} />
                  {saved ? 'Saved!' : 'Save changes'}
                </Button>
              </form>

              <div className="mt-6 border-t border-ink-200 pt-4">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-sm font-medium text-error-600 hover:text-error-700"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Package size={20} />
              Order history
            </h2>

            {loadingOrders ? (
              <div className="flex justify-center py-12">
                <Spinner size={24} />
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/order/${order.id}`}
                    className="block rounded-2xl border border-ink-200 bg-white p-5 transition-shadow hover:shadow-[var(--shadow-pop)]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-ink-900">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-ink-500">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric',
                          })}
                        </p>
                      </div>
                      <Badge variant="neutral" className="capitalize">
                        {orderStatusToLabel(order.status)}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-ink-700">
                            {item.productName} × {item.quantity}
                          </span>
                          <span className="text-ink-600">
                            {formatMoney(item.unitPriceCents * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                      <span className="text-sm font-medium text-ink-600">Total</span>
                      <span className="font-semibold text-ink-900">{formatMoney(order.totalCents)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 py-16 text-center">
                <Package size={32} className="text-ink-300" />
                <p className="mt-3 text-sm font-medium text-ink-700">No orders yet</p>
                <p className="mt-1 text-sm text-ink-500">When you place your first order, it'll show up here.</p>
                <Link to="/shop" className="mt-4">
                  <Button size="sm">Browse frames</Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {tab === 'addresses' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <MapPin size={20} />
                Saved addresses
              </h2>
              <Button size="sm" onClick={() => setShowAddrModal(true)}>
                <Plus size={16} />
                Add address
              </Button>
            </div>

            {loadingAddresses ? (
              <div className="flex justify-center py-12">
                <Spinner size={24} />
              </div>
            ) : addresses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {addresses.map((addr) => (
                  <div key={addr.id} className="rounded-2xl border border-ink-200 bg-white p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-ink-900">{addr.fullName}</p>
                          {addr.isDefault && <Badge variant="primary">Default</Badge>}
                        </div>
                        {addr.label && (
                          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-ink-400">
                            {addr.label}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        aria-label="Delete address"
                        className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-error-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-3 text-sm text-ink-600">
                      <p>{addr.line1}</p>
                      {addr.line2 && <p>{addr.line2}</p>}
                      <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                      <p>{addr.country}</p>
                      {addr.phone && <p className="mt-1">{addr.phone}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 py-16 text-center">
                <MapPin size={32} className="text-ink-300" />
                <p className="mt-3 text-sm font-medium text-ink-700">No saved addresses</p>
                <p className="mt-1 text-sm text-ink-500">
                  Add an address to speed up checkout next time.
                </p>
                <Button size="sm" className="mt-4" onClick={() => setShowAddrModal(true)}>
                  <Plus size={16} />
                  Add address
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        open={showAddrModal}
        onClose={() => setShowAddrModal(false)}
        title="Add address"
      >
        <form onSubmit={handleAddAddress} className="space-y-4">
          <Input
            label="Label (optional)"
            name="label"
            value={addrLabel}
            onChange={(e) => setAddrLabel(e.target.value)}
            placeholder="Home, Work, etc."
          />
          <Input
            label="Full name"
            name="fullName"
            value={addrForm.fullName}
            onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
            required
          />
          <Input
            label="Street address"
            name="line1"
            value={addrForm.line1}
            onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}
            required
          />
          <Input
            label="Apartment, suite, etc. (optional)"
            name="line2"
            value={addrForm.line2 ?? ''}
            onChange={(e) => setAddrForm({ ...addrForm, line2: e.target.value || null })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="City"
              name="city"
              value={addrForm.city}
              onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
              required
            />
            <Input
              label="State"
              name="state"
              value={addrForm.state}
              onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="ZIP code"
              name="postalCode"
              value={addrForm.postalCode}
              onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })}
              required
            />
            <Input
              label="Country"
              name="country"
              value={addrForm.country}
              onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })}
            />
          </div>
          <Input
            label="Phone (optional)"
            name="phone"
            value={addrForm.phone ?? ''}
            onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value || null })}
          />
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={addrIsDefault}
              onChange={(e) => setAddrIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-200"
            />
            Set as default address
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddrModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={savingAddr} disabled={savingAddr} fullWidth>
              <Check size={16} />
              Save address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
