import React from 'react';

export default function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  disabled = false,
  required = false,
  className = ''
}) {
  const hasError = touched && error;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold text-zinc-900 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={`w-full px-4 py-2 rounded-lg bg-zinc-50 border ${
          hasError ? 'border-red-500' : 'border-zinc-200'
        } text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 ${className}`}
      />
      {hasError && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  );
}
