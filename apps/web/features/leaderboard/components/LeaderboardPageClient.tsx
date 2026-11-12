'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Crown, Medal, Award, Trophy, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useGrades } from '@/features/auth/hooks';
import { useLeaderboard } from '../hooks';
import { LeaderboardHonorCards } from './LeaderboardHonorCards';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';

export function LeaderboardPageClient() {
  const [selectedGradeId, setSelectedGradeId] = useState<string | undefined>(undefined);

  const { data: grades, isLoading: isLoadingGrades } = useGrades();
  const {
    data: leaderboard,
    isLoading: isLoadingLeaderboard,
    isError,
    refetch,
    isFetching,
  } = useLeaderboard(selectedGradeId);

  const currentGradeId = selectedGradeId ?? leaderboard?.grade.id;
  const currentGrade = leaderboard?.grade;
  const top10 = leaderboard?.top10 ?? [];
  const top3 = top10.slice(0, 3);
  const totalParticipants = leaderboard?.totalParticipants ?? 0;
  const currentUser = leaderboard?.currentUser ?? null;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-8 space-y-6">
      {/* ─── Tiêu đề trang (Căn giữa) ─── */}
      <div className="text-center space-y-2">
        <nav aria-label="Breadcrumb" className="flex items-center justify-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-ink transition-colors underline-offset-2 hover:underline">
            Trang chủ
          </Link>
          <span className="text-muted/60">/</span>
          <span className="font-medium text-ink-soft">Bảng xếp hạng</span>
        </nav>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          Bảng xếp hạng
        </h1>
        <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
          Bảng vàng vinh danh học sinh có điểm kinh nghiệm (EXP) cao nhất theo từng khối lớp.
        </p>
      </div>

      {/* ─── Bộ chọn khối lớp (Tất cả trên 1 dòng duy nhất - Căn giữa) ─── */}
      <div className="w-full flex justify-center overflow-x-auto scrollbar-none py-1">
        {isLoadingGrades ? (
          <div className="inline-flex items-center justify-center gap-1.5 flex-nowrap">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-16 rounded-md shrink-0" />
            ))}
          </div>
        ) : (
          <div className="inline-flex items-center justify-center gap-1 sm:gap-1.5 flex-nowrap">
            {grades?.map((g) => {
              const isSelected = g.id === currentGradeId;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGradeId(g.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    'px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md border transition-all shrink-0 cursor-pointer whitespace-nowrap',
                    isSelected
                      ? 'bg-seal text-paper border-seal shadow-xs font-semibold'
                      : 'bg-card text-ink-soft border-line hover:border-line-heavy hover:text-ink hover:bg-paper'
                  )}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Trạng thái đang tải ─── */}
      {isLoadingLeaderboard && (
        <div className="space-y-4 max-w-3xl mx-auto" data-testid="leaderboard-loading">
          <Skeleton className="h-14 w-full rounded-t-lg" />
          <div className="grid grid-cols-3 gap-3 p-4 border border-line rounded-md bg-card">
            <Skeleton className="h-44 rounded-md" />
            <Skeleton className="h-52 rounded-md" />
            <Skeleton className="h-44 rounded-md" />
          </div>
          <Skeleton className="h-64 w-full rounded-b-lg" />
        </div>
      )}

      {/* ─── Trạng thái lỗi ─── */}
      {isError && !isLoadingLeaderboard && (
        <ErrorState
          data-testid="leaderboard-error"
          title="Không thể tải bảng xếp hạng"
          description="Đã xảy ra sự cố khi kết nối tới máy chủ. Vui lòng thử lại sau."
          onRetry={() => refetch()}
        />
      )}

      {/* ─── DANH SÁCH DUY NHẤT (BẢNG VÀNG - CĂN GIỮA) ─── */}
      {!isLoadingLeaderboard && !isError && currentGrade && (
        <div className="rounded-lg border border-line bg-card shadow-sm overflow-hidden animate-fadeIn">
          {/* Header của bảng danh sách (Căn giữa) */}
          <div className="px-4 py-4 bg-paper border-b border-line text-center flex flex-col items-center justify-center gap-1 relative">
            <div className="flex items-center justify-center gap-2">
              <Trophy size={20} className="text-seal shrink-0" aria-hidden="true" />
              <h2 className="font-serif font-bold text-ink text-lg sm:text-xl">
                Bảng Vàng {currentGrade.name}
              </h2>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted flex-wrap">
              <span>Top 10 học sinh tích lũy điểm EXP cao nhất</span>
              <span>·</span>
              <span className="font-semibold text-bronze-ink">
                {formatNumber(totalParticipants)} học sinh
              </span>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Làm mới bảng xếp hạng"
              className="absolute right-3 top-3 p-1.5 rounded-md border border-line bg-card hover:bg-paper text-ink-soft hover:text-ink transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Làm mới dữ liệu"
            >
              <RefreshCw
                size={14}
                className={cn('shrink-0', isFetching && 'animate-spin text-seal')}
                aria-hidden="true"
              />
            </button>
          </div>

          {/* 1. Trên cùng: Ảnh thẻ 3 người đứng đầu (Nhì bên trái - Quán quân ở giữa - Ba bên phải) */}
          {top3.length > 0 ? (
            <LeaderboardHonorCards top3={top3} />
          ) : (
            <div className="p-8 text-center text-ink-soft">
              <p className="font-serif font-semibold text-base text-ink">Chưa có dữ liệu xếp hạng</p>
              <p className="text-xs sm:text-sm mt-1">
                Hãy bắt đầu học và làm bài để trở thành người đầu tiên ghi danh trên bảng vàng!
              </p>
            </div>
          )}

          {/* 2. Dưới là danh sách từ 1 đến 10 */}
          {top10.length > 0 && (
            <div className="divide-y divide-line/60">
              <div className="px-4 sm:px-5 py-2.5 bg-paper/40 text-xs font-semibold text-muted uppercase tracking-wider flex items-center justify-between">
                <span>Danh sách xếp hạng (Top 1 – 10)</span>
                <span>Điểm EXP</span>
              </div>

              {top10.map((entry) => {
                const initials = entry.fullName
                  .trim()
                  .split(' ')
                  .slice(-2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase();

                const isFirst = entry.rank === 1;
                const isSecond = entry.rank === 2;
                const isThird = entry.rank === 3;

                return (
                  <div
                    key={entry.userId}
                    className={cn(
                      'px-4 sm:px-5 py-3 flex items-center justify-between gap-3 transition-colors hover:bg-paper/80',
                      entry.isCurrentUser && 'bg-seal/10 ring-1 ring-inset ring-seal/40'
                    )}
                  >
                    {/* Cột trái: Thứ hạng + Avatar + Tên */}
                    <div className="flex items-center gap-3 min-w-0">
                      {isFirst ? (
                        <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                          <Crown size={14} className="text-amber-600" aria-hidden="true" />
                        </span>
                      ) : isSecond ? (
                        <span className="w-7 h-7 rounded-full bg-slate-400/20 text-slate-700 dark:text-slate-300 border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                          <Medal size={14} className="text-slate-600" aria-hidden="true" />
                        </span>
                      ) : isThird ? (
                        <span className="w-7 h-7 rounded-full bg-bronze/20 text-bronze-ink border border-bronze flex items-center justify-center font-bold text-xs shrink-0">
                          <Award size={14} className="text-bronze-ink" aria-hidden="true" />
                        </span>
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-paper border border-line flex items-center justify-center text-xs font-bold text-ink-soft shrink-0">
                          {entry.rank}
                        </span>
                      )}

                      {entry.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={entry.avatar}
                          alt={entry.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-line shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-paper border border-line text-ink-soft font-semibold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              'text-sm truncate',
                              entry.isCurrentUser ? 'font-bold text-seal' : 'font-semibold text-ink'
                            )}
                          >
                            {entry.fullName}
                          </span>
                          {entry.isCurrentUser && (
                            <Badge variant="success" className="text-[10px] h-4 px-1.5 font-bold">
                              Bạn
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted">
                          Cấp {entry.level.displayOrder}: {entry.level.name}
                        </div>
                      </div>
                    </div>

                    {/* Cột phải: Điểm EXP */}
                    <div className="flex items-center gap-1.5 text-bronze-ink font-serif font-bold text-sm sm:text-base shrink-0">
                      <Sparkles size={13} className="text-bronze-ink" aria-hidden="true" />
                      <span>{formatNumber(entry.totalExp)} EXP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. DÒNG CUỐI: THỨ HẠNG CỦA CHÍNH BẠN */}
          <div className="border-t-2 border-line bg-paper">
            {currentUser ? (
              currentUser.isSameGrade ? (
                /* Người dùng thuộc lớp này */
                <div className="px-4 sm:px-5 py-3.5 bg-seal/10 flex items-center justify-between gap-3 border-t border-seal/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-seal text-paper flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                      #{currentUser.rank ?? '-'}
                    </span>

                    {currentUser.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.fullName}
                        className="w-9 h-9 rounded-full object-cover border border-line shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-paper border border-line text-ink-soft font-semibold text-xs flex items-center justify-center shrink-0">
                        {currentUser.fullName
                          .trim()
                          .split(' ')
                          .slice(-2)
                          .map((w) => w[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-seal truncate">
                          {currentUser.fullName}
                        </span>
                        <Badge variant="success" className="text-[10px] h-4 px-1.5 font-bold">
                          Thứ hạng của bạn
                        </Badge>
                      </div>
                      <div className="text-xs text-ink-soft mt-0.5">
                        {currentUser.isInTop10 ? (
                          <span>
                            🎉 Bạn đang nằm trong <strong>Top 10</strong> (hạng #{currentUser.rank} / {formatNumber(totalParticipants)} bạn) · Cấp {currentUser.level.displayOrder}: {currentUser.level.name}
                          </span>
                        ) : (
                          <span>
                            Đang đứng thứ <strong>#{currentUser.rank}</strong> trên {formatNumber(totalParticipants)} học sinh · Cấp {currentUser.level.displayOrder}: {currentUser.level.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-bronze-ink font-serif font-bold text-sm sm:text-base shrink-0">
                    <Sparkles size={13} className="text-bronze-ink" aria-hidden="true" />
                    <span>{formatNumber(currentUser.totalExp)} EXP</span>
                  </div>
                </div>
              ) : currentUser.grade ? (
                /* Người dùng thuộc lớp khác */
                <div className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">Thứ hạng của bạn:</span>
                    <span className="text-muted">
                      Bạn đang theo học <strong>{currentUser.grade.name}</strong>. Bảng trên là của {currentGrade.name}.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedGradeId(currentUser.grade!.id)}
                    className="inline-flex items-center gap-1 text-seal font-semibold hover:underline cursor-pointer shrink-0"
                  >
                    <span>Xem bảng xếp hạng {currentUser.grade.name}</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                /* Người dùng chưa chọn lớp */
                <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted">Bạn chưa cài đặt lớp học. Cập nhật hồ sơ để ghi danh vào bảng xếp hạng.</span>
                  <Link href="/profile" className="text-seal font-semibold hover:underline shrink-0">
                    Cập nhật hồ sơ
                  </Link>
                </div>
              )
            ) : (
              /* Khách chưa đăng nhập */
              <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-xs">
                <span className="text-muted">Đăng nhập để xem thứ hạng hiện tại của chính bạn trên bảng vàng.</span>
                <Link
                  href="/login?from=/leaderboard"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded bg-seal text-paper font-semibold hover:bg-seal-dark transition-colors shrink-0"
                >
                  <span>Đăng nhập</span>
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
