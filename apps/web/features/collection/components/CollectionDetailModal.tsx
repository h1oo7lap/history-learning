'use client';

import React, { useEffect, useState } from 'react';
import { X, Sparkles, Calendar, MapPin, Scroll, User } from 'lucide-react';
import type {
  UserCollectionCharacterDto,
  UserCollectionEventDto,
} from '@history-learning/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, optimizeCloudinaryUrl } from '@/lib/format';
import { formatLifeSpan } from './CharacterCard';
import { formatEventDateRange } from './EventCard';

export type SelectedCollectionItem =
  | { type: 'character'; data: UserCollectionCharacterDto }
  | { type: 'event'; data: UserCollectionEventDto };

export interface CollectionDetailModalProps {
  item: SelectedCollectionItem | null;
  onClose: () => void;
}

export function CollectionDetailModal({
  item,
  onClose,
}: CollectionDetailModalProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [item]);

  useEffect(() => {
    if (!item) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const isCharacter = item.type === 'character';
  const char = isCharacter ? item.data : null;
  const evt = !isCharacter ? item.data : null;

  const lifeSpan = char ? formatLifeSpan(char.birthYear, char.deathYear) : null;
  const dateRange = evt ? formatEventDateRange(evt.startDate, evt.endDate) : null;
  const avatarUrl = char?.avatar ? optimizeCloudinaryUrl(char.avatar, 400) : null;
  const eventImageUrl = evt?.image ? optimizeCloudinaryUrl(evt.image, 400) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-[1px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg border border-bronze/40 bg-card p-6 md:p-8 shadow-pop relative max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng góc phải */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-ink transition-colors p-1.5 rounded-md hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal"
          aria-label="Đóng bảng chi tiết tư liệu"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Tiêu đề danh mục */}
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-seal mb-2">
          <Sparkles size={13} className="text-seal shrink-0" aria-hidden="true" />
          <span>{isCharacter ? 'Nhân vật lịch sử' : 'Sự kiện lịch sử'}</span>
        </div>

        {/* Header với ảnh / emblem */}
        <div className="flex items-start gap-4 mb-4">
          {isCharacter && (
            <div className="w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-md border border-line bg-paper overflow-hidden relative flex items-center justify-center shadow-sm">
              {avatarUrl && !imageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={char!.name}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-seal/10 text-seal">
                  <User size={30} className="text-seal/80" />
                </div>
              )}
            </div>
          )}

          {!isCharacter && (
            <div className="w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-md border border-line bg-paper overflow-hidden relative flex items-center justify-center shadow-sm">
              {eventImageUrl && !imageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={eventImageUrl}
                  alt={evt!.name}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-bronze/10 text-bronze-ink">
                  <Scroll size={32} className="text-bronze-ink shrink-0" aria-hidden="true" />
                </div>
              )}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2
              id="collection-detail-title"
              className="font-serif text-xl sm:text-2xl font-bold text-ink leading-tight"
            >
              {isCharacter ? char!.name : evt!.name}
            </h2>

            {lifeSpan && (
              <div className="flex items-center gap-1.5 text-xs text-muted font-sans font-medium mt-1.5">
                <Calendar size={13} className="shrink-0 text-muted/70" aria-hidden="true" />
                <span>{lifeSpan}</span>
              </div>
            )}

            {dateRange && (
              <div className="flex items-center gap-1.5 text-xs text-muted font-sans font-medium mt-1.5">
                <Calendar size={13} className="shrink-0 text-muted/70" aria-hidden="true" />
                <span>{dateRange}</span>
              </div>
            )}

            {evt?.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted font-sans font-medium mt-1">
                <MapPin size={13} className="shrink-0 text-muted/70" aria-hidden="true" />
                <span>{evt.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Nội dung chi tiết */}
        <div className="space-y-3 pt-3 border-t border-line/60">
          {isCharacter && (
            <>
              {char!.shortDescription && (
                <div className="text-sm font-serif italic text-ink-soft border-l-2 border-bronze/60 pl-3 py-0.5">
                  {char!.shortDescription}
                </div>
              )}

              {char!.biography ? (
                <div className="text-sm text-ink-soft leading-relaxed font-serif whitespace-pre-line">
                  {char!.biography}
                </div>
              ) : !char!.shortDescription ? (
                <p className="text-sm text-muted italic font-serif">
                  Chưa có thông tin chi tiết cho nhân vật này.
                </p>
              ) : null}
            </>
          )}

          {!isCharacter && (
            <>
              {evt!.description ? (
                <div className="text-sm text-ink-soft leading-relaxed font-serif whitespace-pre-line">
                  {evt!.description}
                </div>
              ) : (
                <p className="text-sm text-muted italic font-serif">
                  Chưa có thông tin chi tiết cho sự kiện này.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-6 border-t border-line/60 flex items-center justify-between text-xs font-sans">
          <Badge
            variant="warning"
            className="inline-flex items-center gap-1 py-1 px-2.5 bg-bronze/10 text-bronze-ink border-bronze/30 font-medium"
          >
            <Sparkles size={12} className="text-bronze-ink shrink-0" aria-hidden="true" />
            <span>Đã mở khóa</span>
          </Badge>

          <span className="text-muted">
            Mở khóa lúc {formatDate(isCharacter ? char!.unlockedAt : evt!.unlockedAt)}
          </span>
        </div>

        <div className="mt-5 text-right">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

