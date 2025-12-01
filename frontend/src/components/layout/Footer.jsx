import React from 'react';

/**
 * Footer Component
 * Application footer with links and info
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-transparent border-t border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-400">
        <div>
          <p>© {currentYear} JN Automation.</p>
        </div>

        <div className="flex items-center gap-6">
          <a href="/privacy" className="hover:text-gray-200 transition">Datenschutz</a>
          <a href="/terms" className="hover:text-gray-200 transition">AGB</a>
          <a href="/support" className="hover:text-gray-200 transition">Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
