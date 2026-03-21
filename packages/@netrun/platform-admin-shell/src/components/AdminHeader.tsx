/**
 * AdminHeader — Top header bar with product name, user menu, search, theme toggle.
 *
 * Product-agnostic: receives configuration via props.
 */

import { useState, useRef, useEffect } from 'react';
import type { AuthUser } from '../types.js';

export interface AdminHeaderProps {
  productName: string;
  user: AuthUser | null;
  onLogout: () => void;
  onSearch?: (query: string) => void;
}

export function AdminHeader({
  productName,
  user,
  onLogout,
  onSearch,
}: AdminHeaderProps) {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 56,
        borderBottom: '1px solid var(--border-primary, #222)',
        background: 'var(--bg-panel, #111)',
      }}
    >
      {/* Left: product name (visible on mobile when sidebar is hidden) */}
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary, #fff)' }}>
        {productName}
      </div>

      {/* Center: search */}
      {onSearch && (
        <div style={{ position: 'relative', maxWidth: 320, flex: 1, margin: '0 24px' }}>
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearch(e.target.value);
            }}
            style={{
              width: '100%',
              height: 36,
              padding: '0 12px 0 36px',
              borderRadius: 8,
              border: '1px solid var(--border-primary, #222)',
              background: 'var(--bg-input, #1a1a1a)',
              color: 'var(--text-primary, #fff)',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted, #666)',
              fontSize: 14,
            }}
          >
            S
          </span>
        </div>
      )}

      {/* Right: user menu */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 8,
            border: 'none',
            background: menuOpen ? 'var(--bg-hover, #222)' : 'transparent',
            color: 'var(--text-primary, #fff)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--netrun-green, #90b9ab)',
              color: 'var(--netrun-black, #0a0a0a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </span>
          <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'User'}
          </span>
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              width: 200,
              borderRadius: 8,
              background: 'var(--bg-panel, #111)',
              border: '1px solid var(--border-primary, #222)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-primary, #222)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #fff)' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #666)', marginTop: 2 }}>
                {user?.email}
              </div>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                color: 'var(--error, #ef4444)',
                fontSize: 13,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
