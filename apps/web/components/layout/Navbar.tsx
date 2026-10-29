'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, User, Settings, LogOut, ChevronDown, Star, Menu, X, LayoutDashboard } from 'lucide-react';
import { useMe, useLogout } from '@/features/auth/hooks';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

export interface NavItem {
  href: string;
  label: string;
  /** Chỉ hiển thị khi đã đăng nhập (true) hoặc cho tất cả (undefined/false) */
  authRequired?: boolean;
}

/**
 * Danh sách mục điều hướng trên thanh Navbar.
 * QUY TẮC: Chỉ trỏ tới các trang ĐÃ TỒN TẠI trong apps/web/app.
 * Khi các tính năng sau được xây dựng xong trong lộ trình, hãy mở thêm:
 * - { href: '/missions', label: 'Nhiệm vụ', authRequired: true }
 * - { href: '/collection', label: 'Bộ sưu tập', authRequired: true }
 * - { href: '/ai', label: 'Hỏi đáp AI', authRequired: true }
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Trang chủ' },
  { href: '/lessons', label: 'Bài học' },
  { href: '/quiz', label: 'Quiz', authRequired: true },
  { href: '/chat', label: 'Hỏi đáp', authRequired: true },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: user, isLoading } = useMe();
  const logout = useLogout();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi nhấp chuột ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đóng mobile menu khi chuyển trang
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Khóa cuộn nền khi menu mobile mở
  useEffect(() => {
    if (mobileOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileOpen]);

  // Đóng menu khi nhấn Escape và trả focus về nút mở
  const closeMobileMenu = useCallback(() => {
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dropdownOpen) setDropdownOpen(false);
        if (mobileOpen) closeMobileMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dropdownOpen, mobileOpen, closeMobileMenu]);

  // Focus trap trong drawer mobile
  useEffect(() => {
    if (!mobileOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    drawer.addEventListener('keydown', handleTab);
    return () => drawer.removeEventListener('keydown', handleTab);
  }, [mobileOpen]);

  // Lọc link phù hợp trạng thái đăng nhập
  const visibleLinks = NAV_ITEMS.filter((item) => (item.authRequired ? !!user : true));

  const initials = user?.fullName
    ? user.fullName
      .trim()
      .split(' ')
      .slice(-2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    : 'U';

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === href) {
      e.preventDefault();
      setDropdownOpen(false);
      setMobileOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 w-full bg-paper border-b border-line">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* ─── Logo ─── */}
          <Link
            href="/"
            onClick={(e) => handleLinkClick(e, '/')}
            id="nav-logo"
            className="flex items-center gap-2.5 text-ink hover:text-seal transition-colors shrink-0 select-none group"
          >
            <div className="w-8 h-8 rounded-md bg-seal text-paper flex items-center justify-center shadow-card group-hover:bg-seal-dark transition-colors">
              <History size={18} aria-hidden="true" />
            </div>
            <span className="font-serif font-bold text-lg tracking-tight text-ink">
              Học Lịch Sử
            </span>
          </Link>

          {/* ─── Desktop Navigation Links ─── */}
          <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-1 h-full">
            {visibleLinks.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href + '/'));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  id={`nav-link-${item.href.replace('/', '') || 'home'}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'h-full flex items-center px-3.5 text-[15px] font-sans border-b-2 transition-colors',
                    isActive
                      ? 'border-seal text-seal font-semibold'
                      : 'border-transparent text-ink-soft hover:text-ink hover:border-line font-medium'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* ─── Right Actions ─── */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-line/60 animate-pulse" />
            ) : user ? (
              <>
                {/* EXP Badge (Chỉ hiện khi có dữ liệu thật từ API) */}
                {typeof user.totalExp === 'number' && (
                  <Badge variant="warning" className="hidden sm:inline-flex gap-1 font-medium">
                    <Star size={12} className="fill-current text-bronze-ink" aria-hidden="true" />
                    <span>{user.totalExp.toLocaleString('vi-VN')} EXP</span>
                  </Badge>
                )}

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    id="nav-user-menu-btn"
                    type="button"
                    onClick={() => setDropdownOpen((v) => !v)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                    className="flex items-center gap-2 p-1 rounded-md hover:bg-card border border-transparent hover:border-line transition-colors cursor-pointer"
                  >
                    {user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-line"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-card border border-line text-ink-soft font-semibold text-xs flex items-center justify-center">
                        {initials}
                      </div>
                    )}
                    <span className="hidden sm:inline-block text-sm font-medium text-ink max-w-[120px] truncate">
                      {user.fullName}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        'text-muted transition-transform duration-150',
                        dropdownOpen && 'rotate-180'
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div
                      role="menu"
                      aria-orientation="vertical"
                      className="absolute right-0 top-full mt-1.5 w-56 rounded-md border border-line bg-card shadow-pop py-1 z-50 text-sm font-sans"
                    >
                      <div className="px-3 py-2 border-b border-line/60">
                        <div className="font-semibold text-ink truncate">{user.fullName}</div>
                        <div className="text-xs text-muted truncate">{user.email}</div>
                        {user.grade && (
                          <div className="text-xs text-seal font-medium mt-0.5">
                            {user.grade.name}
                          </div>
                        )}
                      </div>

                      <Link
                        id="nav-profile-link"
                        href="/profile"
                        onClick={(e) => handleLinkClick(e, '/profile')}
                        role="menuitem"
                        className="flex items-center gap-2 px-3 py-2 text-ink-soft hover:bg-paper hover:text-ink transition-colors"
                      >
                        <User size={15} aria-hidden="true" />
                        <span>Hồ sơ cá nhân</span>
                      </Link>

                      <Link
                        id="nav-dashboard-link"
                        href="/dashboard"
                        onClick={(e) => handleLinkClick(e, '/dashboard')}
                        role="menuitem"
                        className="flex items-center gap-2 px-3 py-2 text-ink-soft hover:bg-paper hover:text-ink transition-colors"
                      >
                        <LayoutDashboard size={15} aria-hidden="true" />
                        <span>Bảng điều khiển</span>
                      </Link>

                      {user.role === 'ADMIN' && (
                        <Link
                          id="nav-admin-link"
                          href="/admin"
                          onClick={(e) => handleLinkClick(e, '/admin')}
                          role="menuitem"
                          className="flex items-center gap-2 px-3 py-2 text-ink-soft hover:bg-paper hover:text-ink transition-colors border-t border-line/40"
                        >
                          <Settings size={15} aria-hidden="true" />
                          <span>Khu vực Quản trị</span>
                        </Link>
                      )}

                      <div className="border-t border-line/60 my-1" />

                      <button
                        id="nav-logout-btn"
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setDropdownOpen(false);
                          logout.mutate();
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                      >
                        <LogOut size={15} aria-hidden="true" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  ref={menuButtonRef}
                  id="nav-mobile-menu-btn"
                  type="button"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-expanded={mobileOpen}
                  aria-label={mobileOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
                  className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md text-ink hover:bg-card border border-transparent hover:border-line transition-colors cursor-pointer"
                >
                  {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
                </button>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/login"
                    id="nav-login-btn"
                    className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    id="nav-register-btn"
                    className={buttonStyles({ variant: 'primary', size: 'sm' })}
                  >
                    Bắt đầu học
                  </Link>
                </div>

                {/* Mobile Menu Toggle for guests */}
                <button
                  ref={menuButtonRef}
                  id="nav-mobile-menu-btn"
                  type="button"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-expanded={mobileOpen}
                  aria-label={mobileOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
                  className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md text-ink hover:bg-card border border-transparent hover:border-line transition-colors cursor-pointer"
                >
                  {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Mobile Drawer ─── */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng di động"
          className="fixed inset-0 z-50 md:hidden bg-ink/40 flex justify-end"
          onClick={closeMobileMenu}
        >
          <div
            ref={drawerRef}
            className="w-full max-w-xs h-full bg-paper border-l border-line p-6 flex flex-col justify-between shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Header drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
                <span className="font-serif font-bold text-lg text-ink">Học Lịch Sử</span>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  aria-label="Đóng menu"
                  className="w-11 h-11 rounded-md flex items-center justify-center text-ink hover:bg-card border border-transparent hover:border-line transition-colors cursor-pointer"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              {/* Links */}
              <nav aria-label="Điều hướng di động" className="space-y-1">
                {visibleLinks.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href + '/'));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        handleLinkClick(e, item.href);
                        closeMobileMenu();
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center h-11 px-3 rounded-md text-[15px] font-sans transition-colors',
                        isActive
                          ? 'bg-seal/10 text-seal font-semibold'
                          : 'text-ink-soft hover:bg-card hover:text-ink font-medium'
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom auth actions in drawer */}
            <div className="pt-4 border-t border-line space-y-2">
              {!user ? (
                <>
                  <Link
                    href="/login"
                    className={cn(buttonStyles({ variant: 'secondary', size: 'md' }), 'w-full')}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className={cn(buttonStyles({ variant: 'primary', size: 'md' }), 'w-full')}
                  >
                    Bắt đầu học
                  </Link>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-muted truncate">{user.email}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-danger hover:bg-danger/10"
                    onClick={() => {
                      closeMobileMenu();
                      logout.mutate();
                    }}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    <span>Đăng xuất</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
