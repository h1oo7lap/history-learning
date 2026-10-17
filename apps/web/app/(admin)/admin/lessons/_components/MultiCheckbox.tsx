import { useState } from 'react';

export interface MultiCheckboxProps {
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  isLoading?: boolean;
}

export function MultiCheckbox({
  label,
  options,
  selected,
  onChange,
  isLoading,
}: MultiCheckboxProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleItem = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div>
      <label className="label" style={{ marginBottom: '0.35rem' }}>
        {label}
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
              placeholder={`Tìm ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}
            />
          )}
          <div
            style={{
              maxHeight: 160,
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
            {filtered.map((opt) => (
              <label
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.5rem',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'background 0.1s',
                  background: selected.includes(opt.id)
                    ? 'var(--brand-50, rgb(99 102 241 / 0.08))'
                    : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={() => toggleItem(opt.id)}
                  style={{ accentColor: 'var(--brand-500)' }}
                />
                <span>{opt.name}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Đã chọn: {selected.length}
            </div>
          )}
        </>
      )}
    </div>
  );
}
