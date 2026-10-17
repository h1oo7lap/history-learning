'use client';

import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  labelRight?: ReactNode;
  error?: string;
  children?: ReactNode;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ id, label, labelRight, error, className, style, children, placeholder = '••••••••', ...rest }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div>
        {label ? (
          labelRight ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.375rem',
              }}
            >
              <label className="label" htmlFor={id} style={{ margin: 0 }}>
                {label}
              </label>
              {labelRight}
            </div>
          ) : (
            <label className="label" htmlFor={id}>
              {label}
            </label>
          )
        ) : null}

        <div style={{ position: 'relative' }}>
          <input
            ref={ref}
            id={id}
            type={showPassword ? 'text' : 'password'}
            className={`input${error ? ' error' : ''}${className ? ` ${className}` : ''}`}
            placeholder={placeholder}
            style={{ paddingRight: '2.75rem', ...style }}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error ? <p className="field-error">{error}</p> : null}
        {children}
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';
