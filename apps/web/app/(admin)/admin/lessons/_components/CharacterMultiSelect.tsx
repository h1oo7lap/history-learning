import { useState } from 'react';
import type { TaxonomyOption } from '@/features/admin/api';
import type { CharacterWithRole } from './types';

export interface CharacterMultiSelectProps {
  options: TaxonomyOption[];
  selected: CharacterWithRole[];
  onChange: (selected: CharacterWithRole[]) => void;
  isLoading?: boolean;
}

export function CharacterMultiSelect({
  options,
  selected,
  onChange,
  isLoading,
}: CharacterMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedIds = selected.map((s) => s.characterId);

  const toggleCharacter = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selected.filter((s) => s.characterId !== id));
    } else {
      onChange([...selected, { characterId: id, role: '' }]);
    }
  };

  const updateRole = (characterId: string, role: string) => {
    onChange(selected.map((s) => (s.characterId === characterId ? { ...s, role } : s)));
  };

  return (
    <div>
      <label className="label" style={{ marginBottom: '0.35rem' }}>
        Nhân vật liên quan
      </label>
      {isLoading ? (
        <div style={{ padding: '0.75rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
          Đang tải...
        </div>
      ) : (
        <>
          {options.length > 6 && (
            <input
              className="input"
              placeholder="Tìm nhân vật..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}
            />
          )}
          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.25rem',
            }}
          >
            {filtered.length === 0 && (
              <div
                style={{
                  padding: '0.5rem',
                  color: 'var(--muted)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                }}
              >
                Không tìm thấy
              </div>
            )}
            {filtered.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              const entry = selected.find((s) => s.characterId === opt.id);
              return (
                <div
                  key={opt.id}
                  style={{
                    padding: '0.35rem 0.5rem',
                    borderRadius: 4,
                    background: isSelected
                      ? 'var(--brand-50, rgb(99 102 241 / 0.08))'
                      : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCharacter(opt.id)}
                      style={{ accentColor: 'var(--brand-500)' }}
                    />
                    <span>{opt.name}</span>
                  </label>
                  {isSelected && (
                    <input
                      className="input"
                      placeholder="Vai trò (tuỳ chọn)"
                      value={entry?.role ?? ''}
                      onChange={(e) => updateRole(opt.id, e.target.value)}
                      style={{
                        marginTop: '0.25rem',
                        marginLeft: '1.5rem',
                        fontSize: '0.8rem',
                        padding: '0.25rem 0.5rem',
                        width: 'calc(100% - 1.5rem)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Đã chọn: {selected.length} nhân vật
            </div>
          )}
        </>
      )}
    </div>
  );
}
