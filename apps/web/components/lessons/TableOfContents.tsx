'use client';

import React, { useEffect, useState } from 'react';
import { List, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

import { type HeadingItem } from '@/lib/headings';
export type { HeadingItem };

export interface TableOfContentsProps {
  headings: HeadingItem[];
  className?: string;
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (headings.length === 0) return;

    // Observe each heading element
    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible headings
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by top offset
          visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: [0, 1],
      }
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) {
        observer.observe(el);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  const handleHeadingClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      // Offset for sticky navbar
      const navbarHeight = 80;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
      window.history.pushState(null, '', `#${id}`);
      setActiveId(id);
      setIsMobileOpen(false);
    }
  };

  return (
    <div className={className}>
      {/* ─── Mobile Table of Contents (collapsible button) ─── */}
      <div className="lg:hidden mb-6">
        <div className="border border-line rounded-md bg-card overflow-hidden shadow-card">
          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            aria-expanded={isMobileOpen}
            aria-controls="mobile-toc-list"
            className="w-full flex items-center justify-between p-3.5 text-left text-sm font-medium text-ink hover:bg-paper/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal"
          >
            <span className="flex items-center gap-2">
              <List size={18} className="text-seal shrink-0" aria-hidden="true" />
              <span>Mục lục bài học</span>
              <span className="text-xs text-muted">({headings.length} mục)</span>
            </span>
            <ChevronDown
              size={18}
              className={cn(
                'text-muted transition-transform duration-200 shrink-0',
                isMobileOpen && 'rotate-180 text-ink'
              )}
              aria-hidden="true"
            />
          </button>

          {isMobileOpen && (
            <div
              id="mobile-toc-list"
              className="border-t border-line p-3 bg-paper/30 space-y-1"
            >
              {headings.map((h, idx) => {
                const hasNumberPrefix = /^\d+[\.\)]\s*/.test(h.text);
                return (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    onClick={(e) => handleHeadingClick(e, h.id)}
                    className={cn(
                      'flex items-start gap-2 px-2.5 py-2 text-sm rounded transition-colors',
                      activeId === h.id
                        ? 'bg-seal/10 text-seal font-medium'
                        : 'text-ink-soft hover:bg-card hover:text-ink'
                    )}
                  >
                    {!hasNumberPrefix && (
                      <span className="text-xs text-muted/80 mt-0.5 shrink-0 font-mono">
                        {idx + 1}.
                      </span>
                    )}
                    <span>{h.text}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Desktop Table of Contents (sticky sidebar) ─── */}
      <div className="hidden lg:block lg:sticky lg:top-24">
        <Card className="p-5 shadow-card">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-line text-sm font-semibold text-ink">
            <List size={18} className="text-seal shrink-0" aria-hidden="true" />
            <span>Mục lục bài học</span>
          </div>

          <nav aria-label="Mục lục bài đọc">
            <div className="border-l border-line pl-0 space-y-1 text-sm">
              {headings.map((h, idx) => {
                const hasNumberPrefix = /^\d+[\.\)]\s*/.test(h.text);
                return (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    onClick={(e) => handleHeadingClick(e, h.id)}
                    className={cn(
                      'block py-1.5 pl-3 border-l-2 -ml-px transition-colors duration-150 rounded-r-sm',
                      activeId === h.id
                        ? 'border-seal text-seal font-semibold bg-seal/5'
                        : 'border-transparent text-muted hover:text-ink hover:border-line'
                    )}
                  >
                    {!hasNumberPrefix && (
                      <span className="text-xs text-muted/70 mr-1.5 font-mono">
                        {idx + 1}.
                      </span>
                    )}
                    <span>{h.text}</span>
                  </a>
                );
              })}
            </div>
          </nav>
        </Card>
      </div>
    </div>
  );
}
