import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { KeyRound, Loader2, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [seedKey, setSeedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedKey.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/seed/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedKey: seedKey.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: { message: 'Authentication failed' } }));
        throw new Error(body.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      login(data.token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-2xl">
            N
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">NetrunCMS</h1>
            <p className="text-sm text-muted-foreground">Enter your seed key to continue</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="seedKey" className="text-sm font-medium">
              Seed API Key
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="seedKey"
                type="password"
                value={seedKey}
                onChange={(e) => setSeedKey(e.target.value)}
                placeholder="Enter seed key..."
                autoFocus
                className="flex h-10 w-full rounded-md border border-border bg-background pl-10 pr-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !seedKey.trim()}
            className="flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
