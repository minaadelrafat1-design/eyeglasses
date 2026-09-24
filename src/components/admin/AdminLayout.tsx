import { NavLink, useNavigate } from '@/lib/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tags,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context';
import { cx } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, end: false },
  { to: '/admin/customers', label: 'Customers', icon: Users, end: false },
  { to: '/admin/attributes', label: 'Attributes', icon: Tags, end: false },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink-200 bg-white lg:flex">
        <AdminSidebarContent
          profile={profile}
          onSignOut={handleSignOut}
          onNavigateStore={() => navigate('/')}
        />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white animate-slide-up">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1.5 text-ink-500 hover:bg-ink-100"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            <AdminSidebarContent
              profile={profile}
              onSignOut={handleSignOut}
              onNavigateStore={() => {
                setMobileOpen(false);
                navigate('/');
              }}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-ink-700 hover:bg-ink-100"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="font-display text-lg font-semibold text-ink-900">
            Vuera Admin
          </span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="container-app py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

function AdminSidebarContent({
  profile,
  onSignOut,
  onNavigateStore,
}: {
  profile: { email: string; firstName: string | null; lastName: string | null; role: string } | null;
  onSignOut: () => void;
  onNavigateStore: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-ink-200 px-6">
        <span className="font-display text-xl font-semibold tracking-tight text-ink-900">
          Vuera<span className="text-primary-600">.</span>
        </span>
        <span className="ml-2 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
              )
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-ink-200 p-3">
        <button
          onClick={onNavigateStore}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          <ExternalLink size={18} />
          View Store
        </button>
        <div className="mt-2 rounded-lg bg-ink-50 px-3 py-2.5">
          <p className="truncate text-sm font-medium text-ink-800">
            {profile?.firstName ?? profile?.email ?? 'Admin'}
          </p>
          <p className="text-xs text-ink-500">
            {profile?.role ?? 'staff'}
          </p>
        </div>
        <button
          onClick={onSignOut}
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-error-600 transition-colors hover:bg-error-50"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
