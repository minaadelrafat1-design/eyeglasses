import { Navigate } from '@/lib/navigation';
import { useAuth } from '@/context';
import { Spinner } from '@/components/vui';

/**
 * Wraps a protected route element. Redirects to /signin when there is no
 * authenticated session, and shows a spinner while the session is still
 * loading so a logged-in user doesn't flash through the sign-in screen.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}
