/**
 * LoginPage — Generic login form.
 *
 * username + password -> POST /api/v1/auth/login -> store JWT via useAuth.
 * Product-agnostic: takes productName and logo for branding.
 */

import { useState, type FormEvent, type ReactNode } from 'react';

export interface LoginPageProps {
  productName: string;
  logo?: ReactNode;
  isLoading?: boolean;
  onLogin: (username: string, password: string) => Promise<void>;
  error?: string | null;
}

export function LoginPage({
  productName,
  logo,
  isLoading = false,
  onLogin,
  error: externalError,
}: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const displayError = externalError || error;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    width: '100%',
    height: 44,
    padding: '0 14px',
    borderRadius: 8,
    border: '1px solid var(--border-primary, #333)',
    background: 'var(--bg-input, #1a1a1a)',
    color: 'var(--text-primary, #fff)',
    fontSize: 14,
    outline: 'none',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-base, #0a0a0a)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          padding: 32,
          borderRadius: 16,
          background: 'var(--bg-panel, #111)',
          border: '1px solid var(--border-primary, #222)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Logo and title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {logo && <div style={{ marginBottom: 16 }}>{logo}</div>}
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary, #fff)',
              margin: 0,
            }}
          >
            {productName}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-muted, #666)',
              marginTop: 6,
            }}
          >
            Sign in to your account
          </p>
        </div>

        {/* Error message */}
        {displayError && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--error, #ef4444)',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {displayError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary, #aaa)',
                marginBottom: 6,
              }}
            >
              Username or Email
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={submitting || isLoading}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-secondary, #aaa)',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting || isLoading}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || isLoading}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 8,
              border: 'none',
              background: 'var(--netrun-green, #90b9ab)',
              color: 'var(--netrun-black, #0a0a0a)',
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting || isLoading ? 'not-allowed' : 'pointer',
              opacity: submitting || isLoading ? 0.7 : 1,
              transition: 'opacity 150ms ease',
            }}
          >
            {submitting || isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
