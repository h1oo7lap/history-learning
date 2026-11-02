'use client';

import React, { useState } from 'react';
import { BookOpen, Users, Scroll, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useMyCollection } from '../hooks';
import { CharacterCard } from './CharacterCard';
import { EventCard } from './EventCard';
import {
  CollectionDetailModal,
  type SelectedCollectionItem,
} from './CollectionDetailModal';
import { cn } from '@/lib/cn';

export type CollectionTab = 'characters' | 'events';

export function CollectionPageClient() {
  const { data: collection, isLoading, isError, refetch } = useMyCollection();
  const [activeTab, setActiveTab] = useState<CollectionTab>('characters');
  const [selectedItem, setSelectedItem] = useState<SelectedCollectionItem | null>(null);

  const characters = collection?.characters ?? [];
  const events = collection?.events ?? [];
  const totalCharacters = collection?.totalCharacters ?? 0;
  const totalEvents = collection?.totalEvents ?? 0;
  const totalCards = collection?.totalCards ?? 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 md:py-10">
      {/* ─── Tiêu đề trang ─── */}
      <PageHeader
        title="Bộ sưu tập"
        description="Kho tàng các nhân vật và sự kiện lịch sử hào hùng bạn đã mở khóa qua các bài học."
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Bộ sưu tập' },
        ]}
        actions={
          totalCards > 0 ? (
            <Badge
              variant="warning"
              className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs sm:text-sm font-medium bg-bronze/10 text-bronze-ink border-bronze/30 shadow-sm"
            >
              <Sparkles size={14} className="text-bronze-ink shrink-0" aria-hidden="true" />
              <span>Đã sưu tầm <strong>{totalCards}</strong> tư liệu</span>
            </Badge>
          ) : undefined
        }
      />

      {/* ─── Trạng thái 1: Đang tải ─── */}
      {isLoading && (
        <div className="space-y-6" data-testid="collection-loading">
          {/* Skeleton tabs */}
          <div className="flex gap-2 border-b border-line pb-3">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>

          {/* Skeleton cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-md border border-line bg-card p-4 sm:p-5 space-y-4"
              >
                <div className="flex items-start gap-3.5">
                  <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-md shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-5/6" />
                </div>
                <div className="pt-3 border-t border-line/60 flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Trạng thái 2: Lỗi tải dữ liệu ─── */}
      {isError && !isLoading && (
        <ErrorState
          data-testid="collection-error"
          title="Không thể tải bộ sưu tập"
          description="Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng thử lại sau ít phút."
          onRetry={() => refetch()}
        />
      )}

      {/* ─── Trạng thái 3: Toàn bộ bộ sưu tập rỗng ─── */}
      {!isLoading && !isError && totalCards === 0 && (
        <EmptyState
          data-testid="collection-empty"
          icon={BookOpen}
          title="Chưa có tư liệu nào được mở khóa."
          description="Hãy hoàn thành các bài học để sưu tầm thêm nhân vật và sự kiện lịch sử hào hùng."
          action={{
            label: 'Khám phá bài học',
            href: '/lessons',
          }}
        />
      )}

      {/* ─── Trạng thái 4: Bộ sưu tập có dữ liệu ─── */}
      {!isLoading && !isError && totalCards > 0 && (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div
            role="tablist"
            aria-label="Phân loại bộ sưu tập"
            className="flex items-center gap-2 border-b border-line pb-px overflow-x-auto select-none"
          >
            <button
              id="tab-characters"
              role="tab"
              type="button"
              aria-selected={activeTab === 'characters'}
              aria-controls="tabpanel-characters"
              onClick={() => setActiveTab('characters')}
              className={cn(
                'min-h-[44px] px-4 py-2 text-sm sm:text-base font-sans font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-t-sm',
                activeTab === 'characters'
                  ? 'border-seal text-seal font-semibold'
                  : 'border-transparent text-ink-soft hover:text-ink hover:border-line'
              )}
            >
              <Users size={16} aria-hidden="true" />
              <span>Nhân vật</span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  activeTab === 'characters'
                    ? 'bg-seal/10 text-seal'
                    : 'bg-line/60 text-muted'
                )}
              >
                {totalCharacters}
              </span>
            </button>

            <button
              id="tab-events"
              role="tab"
              type="button"
              aria-selected={activeTab === 'events'}
              aria-controls="tabpanel-events"
              onClick={() => setActiveTab('events')}
              className={cn(
                'min-h-[44px] px-4 py-2 text-sm sm:text-base font-sans font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors cursor-pointer',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-t-sm',
                activeTab === 'events'
                  ? 'border-seal text-seal font-semibold'
                  : 'border-transparent text-ink-soft hover:text-ink hover:border-line'
              )}
            >
              <Scroll size={16} aria-hidden="true" />
              <span>Sự kiện</span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  activeTab === 'events'
                    ? 'bg-seal/10 text-seal'
                    : 'bg-line/60 text-muted'
                )}
              >
                {totalEvents}
              </span>
            </button>
          </div>

          {/* Tab Panel: Nhân vật */}
          {activeTab === 'characters' && (
            <section
              id="tabpanel-characters"
              role="tabpanel"
              aria-labelledby="tab-characters"
              tabIndex={0}
              className="focus-visible:outline-none"
            >
              {characters.length === 0 ? (
                <EmptyState
                  data-testid="characters-empty"
                  icon={Users}
                  title="Chưa có nhân vật nào được mở khóa."
                  description="Hãy hoàn thành các bài học liên quan để diện kiến những danh nhân lịch sử."
                  action={{
                    label: 'Khám phá bài học',
                    href: '/lessons',
                  }}
                />
              ) : (
                <div
                  data-testid="characters-grid"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                >
                  {characters.map((char) => (
                    <CharacterCard
                      key={char.id}
                      character={char}
                      onSelect={(c) => setSelectedItem({ type: 'character', data: c })}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Tab Panel: Sự kiện */}
          {activeTab === 'events' && (
            <section
              id="tabpanel-events"
              role="tabpanel"
              aria-labelledby="tab-events"
              tabIndex={0}
              className="focus-visible:outline-none"
            >
              {events.length === 0 ? (
                <EmptyState
                  data-testid="events-empty"
                  icon={Scroll}
                  title="Chưa có sự kiện nào được mở khóa."
                  description="Hãy hoàn thành các bài học để khám phá những dấu mốc lịch sử hào hùng."
                  action={{
                    label: 'Khám phá bài học',
                    href: '/lessons',
                  }}
                />
              ) : (
                <div
                  data-testid="events-grid"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
                >
                  {events.map((evt) => (
                    <EventCard
                      key={evt.id}
                      event={evt}
                      onSelect={(e) => setSelectedItem({ type: 'event', data: e })}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      <CollectionDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
