'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import type { PublishStatus } from '@/features/admin/api';

// ─── Types ──────────────────────────────────────────────────────

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'date' | 'url' | 'image';

export interface FieldDef {
  /** Field key in form data */
  name: string;
  /** Display label */
  label: string;
  /** Field type */
  type: FieldType;
  /** Placeholder text */
  placeholder?: string;
  /** Is this field required? */
  required?: boolean;
  /** Hint text below the field label */
  hint?: string;
  /** Options for select type */
  options?: { value: string; label: string }[];
  /** Textarea rows */
  rows?: number;
  /** Group with another field in the same row */
  group?: string;
  /** Custom validation function */
  validate?: (value: unknown) => string | undefined;
  /** Width within a group (fraction, default 1) */
  flex?: number;
}

export interface EntityFormProps<T> {
  /** Whether the dialog is open */
  open: boolean;
  /** Entity being edited (null = create mode) */
  entity: T | null;
  /** Form field definitions */
  fields: FieldDef[];
  /** Dialog title in create mode */
  createTitle: string;
  /** Dialog title in edit mode */
  editTitle: string;
  /** Whether save is in progress */
  isPending: boolean;
  /** Form submit handler, receives the form data object */
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  /** Close handler */
  onClose: () => void;
  /** Optional custom footer content */
  footer?: ReactNode;
  /** Max dialog width */
  maxWidth?: number;
}

// ─── Component ──────────────────────────────────────────────────

export function EntityForm<T extends Record<string, any>>({
  open,
  entity,
  fields,
  createTitle,
  editTitle,
  isPending,
  onSubmit,
  onClose,
  maxWidth = 560,
}: EntityFormProps<T>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form when dialog opens
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (open) {
      const initial: Record<string, unknown> = {};
      for (const field of fields) {
        if (entity) {
          const val = entity[field.name];
          // Convert numbers and dates to string for input fields
          if (field.type === 'number') {
            initial[field.name] = val != null ? String(val) : '';
          } else if (field.type === 'date') {
            initial[field.name] = val ? String(val).slice(0, 10) : '';
          } else {
            initial[field.name] = val ?? '';
          }
        } else {
          // Default values for create mode
          if (field.type === 'select' && field.options?.length) {
            initial[field.name] = field.options[0].value;
          } else {
            initial[field.name] = '';
          }
        }
      }
      setForm(initial);
      setErrors({});
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open, entity, fields]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    for (const field of fields) {
      const val = form[field.name];
      // Required check
      if (field.required && (val === '' || val === null || val === undefined)) {
        errs[field.name] = `${field.label} không được để trống`;
        continue;
      }
      // Number check
      if (field.type === 'number' && val !== '' && val !== null && val !== undefined) {
        if (isNaN(Number(val))) {
          errs[field.name] = `${field.label} phải là số`;
          continue;
        }
      }
      // Custom validation
      if (field.validate) {
        const msg = field.validate(val);
        if (msg) errs[field.name] = msg;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Build the DTO — transform values based on field type
    const dto: Record<string, unknown> = {};
    for (const field of fields) {
      const val = form[field.name];
      if (field.type === 'number') {
        dto[field.name] = val !== '' ? Number(val) : null;
      } else if (field.type === 'text' || field.type === 'textarea' || field.type === 'url' || field.type === 'image') {
        const str = String(val ?? '').trim();
        dto[field.name] = str || (field.required ? str : null);
      } else if (field.type === 'date') {
        dto[field.name] = val !== '' ? String(val) : null;
      } else {
        dto[field.name] = val;
      }
    }

    await onSubmit(dto);
  };

  const updateField = (name: string, value: unknown) => {
    setForm((f) => ({ ...f, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[name];
        return next;
      });
    }
  };

  // Group fields by their group key
  const groupedFields: { group: string | null; fields: FieldDef[] }[] = [];
  const seen = new Set<string>();
  for (const field of fields) {
    if (seen.has(field.name)) continue;
    seen.add(field.name);
    if (field.group) {
      const existing = groupedFields.find((g) => g.group === field.group);
      if (existing) {
        existing.fields.push(field);
      } else {
        groupedFields.push({ group: field.group, fields: [field] });
      }
      // Mark the rest of same group
      for (const f2 of fields) {
        if (f2.group === field.group && f2.name !== field.name) {
          seen.add(f2.name);
          const eg = groupedFields.find((g) => g.group === field.group);
          if (eg && !eg.fields.includes(f2)) eg.fields.push(f2);
        }
      }
    } else {
      groupedFields.push({ group: null, fields: [field] });
    }
  }

  const renderField = (field: FieldDef) => {
    const hasError = !!errors[field.name];
    const commonInputStyle: React.CSSProperties = {};

    return (
      <div key={field.name} style={{ flex: field.flex ?? 1 }}>
        <label className="label" htmlFor={`field-${field.name}`}>
          {field.label}
          {field.required && <span style={{ color: 'var(--error)', marginLeft: 4 }}>*</span>}
          {field.hint && (
            <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 6, fontSize: '0.8rem' }}>
              {field.hint}
            </span>
          )}
        </label>

        {field.type === 'textarea' ? (
          <textarea
            id={`field-${field.name}`}
            className={`input${hasError ? ' error' : ''}`}
            rows={field.rows ?? 3}
            placeholder={field.placeholder}
            value={String(form[field.name] ?? '')}
            onChange={(e) => updateField(field.name, e.target.value)}
            style={{ resize: 'vertical', minHeight: 80, ...commonInputStyle }}
          />
        ) : field.type === 'select' ? (
          <select
            id={`field-${field.name}`}
            className={`input${hasError ? ' error' : ''}`}
            value={String(form[field.name] ?? '')}
            onChange={(e) => updateField(field.name, e.target.value)}
            style={commonInputStyle}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            id={`field-${field.name}`}
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' || field.type === 'image' ? 'url' : 'text'}
            className={`input${hasError ? ' error' : ''}`}
            placeholder={field.placeholder}
            value={String(form[field.name] ?? '')}
            onChange={(e) => updateField(field.name, e.target.value)}
            style={commonInputStyle}
          />
        )}

        {hasError && <p className="field-error">{errors[field.name]}</p>}
      </div>
    );
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      style={{
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        padding: 0,
        background: 'transparent',
        maxWidth,
        width: '95vw',
        position: 'fixed',
        margin: 0,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        boxShadow: 'var(--shadow-xl)',
        maxHeight: '85vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
            {entity ? `✏️ ${editTitle}` : `➕ ${createTitle}`}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.25rem', color: 'var(--muted)', lineHeight: 1,
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 'var(--radius-sm)',
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {groupedFields.map((group, i) => {
            if (group.fields.length === 1) {
              return renderField(group.fields[0]);
            }
            return (
              <div key={`group-${i}`} style={{ display: 'grid', gridTemplateColumns: group.fields.map(() => '1fr').join(' '), gap: '0.75rem' }}>
                {group.fields.map((f) => renderField(f))}
              </div>
            );
          })}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isPending}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending} style={{ minWidth: 100 }}>
              {isPending ? '⏳ Đang lưu...' : entity ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        dialog::backdrop {
          background: rgb(0 0 0 / 0.4);
          backdrop-filter: blur(2px);
        }
      `}</style>
    </dialog>
  );
}
