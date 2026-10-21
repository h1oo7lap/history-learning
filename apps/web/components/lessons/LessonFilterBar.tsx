'use client';

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, Loader2, X, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export interface LessonFilterBarProps {
  initialSearch?: string;
  initialDifficulty?: string;
  gradeId: string;
  gradeLabel: string;
}

export function LessonFilterBar({
  initialSearch = '',
  initialDifficulty = '',
  gradeId,
  gradeLabel,
}: LessonFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [difficulty, setDifficulty] = useState(initialDifficulty);

  // Đồng bộ lại local state khi searchParams thay đổi từ bên ngoài (chuyển lớp, back/forward)
  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setDifficulty(initialDifficulty);
  }, [initialDifficulty]);

  const updateFilters = useCallback(
    (newSearch: string, newDifficulty: string) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');

      if (gradeId) {
        params.set('grade', gradeId);
      }

      if (newSearch.trim()) {
        params.set('search', newSearch.trim());
      } else {
        params.delete('search');
      }

      if (newDifficulty) {
        params.set('difficulty', newDifficulty);
      } else {
        params.delete('difficulty');
      }

      // Reset về trang 1 khi lọc hoặc tìm kiếm thay đổi
      params.delete('page');

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams, gradeId]
  );

  // Tự động tìm kiếm sau 300ms khi gõ (debounce)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (search !== initialSearch) {
        updateFilters(search, difficulty);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, difficulty, initialSearch, updateFilters]);

  // Tự động lọc ngay khi chọn độ khó
  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDifficulty(val);
    updateFilters(search, val);
  };

  const handleClearSearch = () => {
    setSearch('');
    updateFilters('', difficulty);
  };

  const handleResetAll = () => {
    setSearch('');
    setDifficulty('');
    updateFilters('', '');
  };

  const hasFilter = Boolean(search || difficulty);

  return (
    <div
      role="search"
      aria-label="Tìm kiếm và lọc bài học tự động"
      className="p-4 rounded-md border border-line bg-card shadow-card space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Ô tìm kiếm tự động khi gõ */}
        <div className="sm:col-span-7 md:col-span-8 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none flex items-center">
            {isPending ? (
              <Loader2 size={18} className="animate-spin text-seal" aria-label="Đang lọc..." />
            ) : (
              <Search size={18} aria-hidden="true" />
            )}
          </div>
          <Input
            id="lesson-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Tìm bài học, nhân vật trong ${gradeLabel}... (tự động tìm khi gõ)`}
            className="pl-9 pr-9"
            aria-label="Tìm kiếm bài học tự động"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1 rounded-sm focus:outline-none focus:ring-1 focus:ring-seal"
              title="Xóa nội dung tìm kiếm"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Lọc độ khó tự động khi chọn */}
        <div className="sm:col-span-5 md:col-span-4 flex items-center gap-2">
          <Select
            id="lesson-difficulty-select"
            value={difficulty}
            onChange={handleDifficultyChange}
            aria-label="Lọc theo độ khó tự động"
            className="flex-1"
          >
            <option value="">Tất cả độ khó</option>
            <option value="EASY">Cơ bản</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Nâng cao</option>
          </Select>

          {hasFilter && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleResetAll}
              id="lesson-clear-filter"
              title="Đặt lại bộ lọc"
              aria-label="Đặt lại bộ lọc"
              className="shrink-0"
            >
              <RotateCcw size={16} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Đặt lại</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
