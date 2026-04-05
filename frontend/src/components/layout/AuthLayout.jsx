import React from 'react';

/**
 * AuthLayout Component
 * Layout for authentication pages (login, register)
 */
const AuthLayout = ({
  children,
  title = 'Welcome',
  subtitle = ''
}) => {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-4">
      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500">
              {subtitle}
            </p>
          )}
        </div>

        {/* Form Container */}
        <div className="border border-gray-200 rounded-xl p-8">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} JN Business System
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
