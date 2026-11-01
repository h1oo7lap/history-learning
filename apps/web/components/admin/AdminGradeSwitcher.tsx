'use client';

import React from 'react';

export interface AdminGradeItem {
  id: string;
  name: string;
  code?: string;
}

export interface AdminGradeSwitcherProps {
  grades: AdminGradeItem[];
  selectedGradeId: string;
  onSelectGrade: (gradeId: string) => void;
  entityName?: string;
  isLoading?: boolean;
}

export function AdminGradeSwitcher({
  grades,
  selectedGradeId,
  onSelectGrade,
  entityName = 'nội dung',
  isLoading = false,
}: AdminGradeSwitcherProps) {
  if (isLoading || grades.length === 0) {
    return null;
  }

  const selectedGrade = grades.find((g) => g.id === selectedGradeId);

  return (
    <div
      className="card"
      style={{
        padding: '0.875rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>🎓 Khối lớp biên soạn:</span>
          <span style={{ color: 'var(--brand-500)', fontWeight: 700 }}>
            {selectedGrade ? selectedGrade.name : 'Tất cả các lớp'}
          </span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
          Chuyển đổi khối lớp để lọc và quản lý {entityName} theo chương trình
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => onSelectGrade('ALL')}
          className={`btn btn-sm ${selectedGradeId === 'ALL' || !selectedGradeId ? 'btn-primary' : 'btn-ghost'}`}
          style={{
            borderRadius: 20,
            padding: '0.25rem 0.875rem',
            fontSize: '0.82rem',
            fontWeight: selectedGradeId === 'ALL' || !selectedGradeId ? 700 : 500,
            border: selectedGradeId === 'ALL' || !selectedGradeId ? undefined : '1px solid var(--border)',
          }}
        >
          Tất cả các lớp
        </button>

        {grades.map((grade) => {
          const isSelected = selectedGradeId === grade.id;
          return (
            <button
              key={grade.id}
              type="button"
              onClick={() => onSelectGrade(grade.id)}
              className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                borderRadius: 20,
                padding: '0.25rem 0.875rem',
                fontSize: '0.82rem',
                fontWeight: isSelected ? 700 : 500,
                border: isSelected ? undefined : '1px solid var(--border)',
              }}
            >
              {grade.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

