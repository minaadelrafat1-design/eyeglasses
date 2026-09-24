import { useState } from 'react';
import { Link, Navigate, useNavigate } from '@/lib/navigation';
import { Glasses, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/vui';
import { useAuth } from '@/context';

export function SignInPage() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/account" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-ink-200 bg-white p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <Link to="/" className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
              <Glasses className="h-6 w-6 text-primary-600" aria-hidden />
              Vuera
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-ink-500">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-error-50 p-3 text-sm text-error-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
            <Button type="submit" size="lg" fullWidth isLoading={loading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-primary-700 hover:text-primary-800">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
