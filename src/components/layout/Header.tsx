import { Link, NavLink } from '@/lib/navigation';
import { Glasses, Search, ShoppingBag, User, Shield, Heart } from 'lucide-react';
import { useCart, useAuth } from '@/context';
import { cx } from '@/lib/utils';

const navLinks = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop/sunglasses', label: 'Sunglasses' },
  { to: '/try-on', label: 'Virtual Try-On' },
  { to: '/assistant', label: 'AI Assistant' },
];

export function Header() {
  const { count } = useCart();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'staff';

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/85 backdrop-blur-md">
      <div className="container-app flex h-[var(--header-height)] items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-ink-900">
          <Glasses className="h-6 w-6 text-primary-600" aria-hidden />
          <span>Vuera</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cx(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary-700'
                    : 'text-ink-600 hover:text-ink-900',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary-700'
                    : 'text-ink-600 hover:text-ink-900',
                )
              }
            >
              <Shield size={16} />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            to="/search"
            aria-label="Search"
            className="rounded-md p-2.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
          >
            <Search size={20} />
          </Link>
          <Link
            to="/account"
            aria-label="Account"
            className="rounded-md p-2.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
          >
            <User size={20} />
          </Link>
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="rounded-md p-2.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
          >
            <Heart size={20} />
          </Link>
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative rounded-md p-2.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1 text-xs font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
