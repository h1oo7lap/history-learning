'use client';

import React, { useState } from 'react';
import { User, Sparkles, Calendar } from 'lucide-react';
import type { UserCollectionCharacterDto } from '@history-learning/shared';
import { Badge } from '@/components/ui/Badge';
import { formatDate, optimizeCloudinaryUrl } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface CharacterCardProps {
  character: UserCollectionCharacterDto;
  onSelect?: (character: UserCollectionCharacterDto) => void;
  className?: string;
}

export function formatLifeSpan(birthYear?: number | null, deathYear?: number | null): string | null {
  if (birthYear != null && deathYear != null) {
    return `${birthYear} – ${deathYear}`;
  }
  if (birthYear != null) {
    return `Sinh năm ${birthYear}`;
  }
  if (deathYear != null) {
    return `Mất năm ${deathYear}`;
  }
  return null;
}

export function CharacterCard({
  character,
  onSelect,
  className,
}: CharacterCardProps) {
  const [imageError, setImageError] = useState(false);

  const lifeSpan = formatLifeSpan(character.birthYear, character.deathYear);
  const description = character.shortDescription || character.biography;
  const initial = character.name.trim().charAt(0).toUpperCase();
  const avatarUrl = character.avatar ? optimizeCloudinaryUrl(character.avatar, 240) : null;
  const showFallback = !avatarUrl || imageError;

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={() => onSelect?.(character)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(character);
        }
      }}
      aria-label={`Xem tư liệu nhân vật ${character.name}`}
      className={cn(
        'group text-left flex flex-col justify-between rounded-md border border-line bg-card p-4 sm:p-5 transition-all duration-200',
        'hover:border-bronze hover:shadow-card cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal',
        className
      )}
    >
      <div className="space-y-3">
        {/* Header với ảnh đại diện và tên */}
        <div className="flex items-start gap-3.5">
          {/* Avatar container */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-md border border-line bg-paper overflow-hidden relative flex items-center justify-center select-none shadow-sm">
            {avatarUrl && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={character.name}
                loading="lazy"
                decoding="async"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : null}

            {showFallback && (
              <div
                data-testid="character-fallback"
                className="flex flex-col items-center justify-center w-full h-full bg-seal/10 text-seal"
                aria-hidden="true"
              >
                {initial ? (
                  <span className="font-serif font-bold text-lg sm:text-xl">{initial}</span>
                ) : (
                  <User size={22} className="text-seal/80" />
                )}
              </div>
            )}
          </div>

          {/* Tên và năm sinh - mất */}
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-base sm:text-lg font-bold text-ink leading-snug group-hover:text-seal transition-colors line-clamp-2">
              {character.name}
            </h3>

            {lifeSpan && (
              <div className="flex items-center gap-1 text-xs text-muted font-sans font-medium mt-1">
                <Calendar size={12} className="shrink-0 text-muted/70" aria-hidden="true" />
                <span>{lifeSpan}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mô tả nhân vật */}
        {description ? (
          <p className="font-serif text-[13px] sm:text-sm text-ink-soft leading-relaxed line-clamp-3">
            {description}
          </p>
        ) : (
          <p className="text-xs text-muted italic font-serif">
            Chưa có tóm tắt chi tiết cho nhân vật này.
          </p>
        )}
      </div>

      {/* Footer: Trạng thái đã mở khóa + Ngày mở khóa */}
      <div className="pt-3 mt-4 border-t border-line/60 flex items-center justify-between text-xs font-sans gap-2">
        <Badge
          variant="warning"
          className="inline-flex items-center gap-1 text-[11px] font-medium py-0.5 px-2 bg-bronze/10 text-bronze-ink border-bronze/30"
        >
          <Sparkles size={11} className="text-bronze-ink shrink-0" aria-hidden="true" />
          <span>Đã mở khóa</span>
        </Badge>

        <span className="text-muted text-[11px] truncate">
          {formatDate(character.unlockedAt)}
        </span>
      </div>
    </article>
  );
}
