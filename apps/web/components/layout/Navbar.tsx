'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  History, BookOpen, Target, Trophy, Search, LayoutDashboard,
  User, Settings, LogOut, ChevronDown, Star, Sparkles, Menu, X,
} from 'lucide-react';
import { useMe, useLogout } from '@/features/auth/hooks';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
  { href: '/learning', label: 'Bài học', icon: BookOpen },
  { href: '/missions', label: 'Nhiệm vụ', icon: Target },
  { href: '/collection', label: 'Bộ sưu tập', icon: Trophy },
  { href: '/ai', label: 'AI Hỗ trợ', icon: Sparkles },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: user, isLoading } = useMe();
  const logout = useLogout();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const initials = user?.fullName
    ? user.fullName.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    <>
      <nav className="navbar">
        <div className="container-page">
          <div style={{ display: 'flex', alignItems: 'center', height: 64, gap: '1.5rem' }}>
            {/* Logo */}
            <Link href="/" id="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', flexShrink: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <History size={18} color="white" />
              </div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--foreground)' }}>
                Học Lịch Sử
              </span>
            </Link>

            {/* Desktop nav links */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1 }} className="desktop-nav">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <Link
                      key={href}
                      href={href}
                      id={`nav-link-${href.slice(1)}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.4rem 0.75rem', borderRadius: 8,
                        fontSize: '0.9rem', fontWeight: active ? 600 : 500,
                        color: active ? 'var(--brand-600)' : 'var(--muted)',
                        textDecoration: 'none',
                        background: active ? 'var(--brand-50)' : 'transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={16} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Spacer for non-auth */}
            {!user && <div style={{ flex: 1 }} />}

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
              {isLoading ? (
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
              ) : user ? (
                <>
                  {/* EXP badge */}
                  <div className="badge badge-exp" style={{ display: 'flex' }}>
                    <Star size={13} />
                    {user.totalExp.toLocaleString()} EXP
                  </div>

                  {/* Search */}
                  <Link href="/search" id="nav-search-btn" style={{
                    display: 'flex', padding: '0.4rem', borderRadius: 8,
                    color: 'var(--muted)', textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}>
                    <Search size={19} />
                  </Link>

                  {/* User dropdown */}
                  <div className="dropdown" ref={dropdownRef}>
                    <button
                      id="nav-user-menu-btn"
                      onClick={() => setDropdownOpen(v => !v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '0.25rem', borderRadius: 10,
                      }}
                    >
                      {user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatar} alt={user.fullName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div className="avatar">{initials}</div>
                      )}
                      <ChevronDown
                        size={15}
                        style={{
                          color: 'var(--muted)',
                          transition: 'transform 0.2s',
                          transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                        }}
                      />
                    </button>

                    {dropdownOpen && (
                      <div className="dropdown-menu">
                        {/* User info */}
                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--foreground)' }}>
                            {user.fullName}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{user.email}</div>
                          {user.grade && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--brand-500)', marginTop: '0.25rem' }}>
                              {user.grade.name}
                            </div>
                          )}
                        </div>

                        <Link id="nav-profile-link" href="/profile" className="dropdown-item">
                          <User size={16} /> Hồ sơ cá nhân
                        </Link>
                        <Link id="nav-progress-link" href="/progress" className="dropdown-item">
                          <BookOpen size={16} /> Tiến độ học tập
                        </Link>

                        {user.role === 'ADMIN' && (
                          <>
                            <div className="dropdown-separator" />
                            <Link id="nav-admin-link" href="/admin" className="dropdown-item">
                              <Settings size={16} /> Quản trị viên
                            </Link>
                          </>
                        )}

                        <div className="dropdown-separator" />

                        <button
                          id="nav-logout-btn"
                          className="dropdown-item danger"
                          onClick={() => {
                            setDropdownOpen(false);
                            logout.mutate();
                          }}
                        >
                          <LogOut size={16} /> Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mobile menu toggle */}
                  <button
                    id="nav-mobile-menu-btn"
                    className="mobile-only btn btn-ghost"
                    onClick={() => setMobileMenuOpen(v => !v)}
                    style={{ padding: '0.4rem' }}
                    aria-label="Mở menu"
                  >
                    {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" id="nav-login-btn" className="btn btn-ghost btn-sm">Đăng nhập</Link>
                  <Link href="/register" id="nav-register-btn" className="btn btn-primary btn-sm">Đăng ký</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {user && mobileMenuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }} onClick={() => setMobileMenuOpen(false)}>
          <div style={{
            position: 'absolute', top: 64, right: 0, bottom: 0, width: '80%', maxWidth: 320,
            background: 'var(--surface)',
            padding: '1rem 0',
            overflowY: 'auto',
            animation: 'slideIn 0.2s ease',
          }} onClick={e => e.stopPropagation()}>
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.875rem 1.25rem',
                    color: active ? 'var(--brand-600)' : 'var(--foreground)',
                    fontWeight: active ? 600 : 400,
                    textDecoration: 'none',
                    background: active ? 'var(--brand-50)' : 'transparent',
                  }}
                >
                  <Icon size={20} /> {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
        }
        @media (min-width: 768px) {
          .mobile-only { display: none !important; }
        }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}
