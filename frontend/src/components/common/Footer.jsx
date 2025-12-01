import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-black border-t border-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Company */}
          <div>
            <h3 className="text-lg font-bold text-purple-500 mb-4">JN Salon</h3>
            <p className="text-gray-400 text-sm">Dein Salon Management System</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-gray-300 mb-4">Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/" className="hover:text-purple-400">Home</a></li>
              <li><a href="/booking/public" className="hover:text-purple-400">Termin buchen</a></li>
              <li><a href="/login" className="hover:text-purple-400">Login</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-gray-300 mb-4">Kontakt</h4>
            <p className="text-gray-400 text-sm">Email: info@jnsalon.de</p>
            <p className="text-gray-400 text-sm">Tel: +49 123 456789</p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; 2025 JN Business System. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}
