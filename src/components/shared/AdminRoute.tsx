import { Navigate } from '@/lib/navigation';
import { useAuth } from '@/context';
import { Spinner } from '@/components/vui';

/**
 * Guards admin-only routes. Requires an authenticated session AND a
 * profile role of 'admin' or 'staff'. Redirects customers to the home
 * page and unauthenticated users to the sign-in screen.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <Spinner size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (profile && profile.role !== 'admin' && profile.role !== 'staff') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
