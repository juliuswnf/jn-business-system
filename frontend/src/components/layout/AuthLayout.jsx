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
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Form Container */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} JN Automation
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
