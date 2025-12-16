import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();

  return (
    <footer className="bg-black border-t border-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-white flex items-center justify-center">
                <span className="font-bold text-black">JN</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">JN Business System</h3>
                <p className="text-gray-500 text-xs">Terminbuchungen leicht gemacht</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-medium mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/salons" className="text-gray-400 hover:text-white transition">
                  Anbieter
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white transition">
                  Preise
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-white transition">
                  Anmelden
                </Link>
              </li>
              <li>
                <Link to="/login/business" className="text-gray-400 hover:text-white transition">
                  Registrieren
                </Link>
              </li>
            </ul>
          </div>

          {/* Produkt - nur für Business User */}
          {user && (user.role === 'salon_owner' || user.role === 'employee' || user.role === 'ceo') && (
            <div>
              <h4 className="text-white font-medium mb-4">Für Unternehmen</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/dashboard" className="text-gray-400 hover:text-white transition">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/bookings" className="text-gray-400 hover:text-white transition">
                    Termine
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/services" className="text-gray-400 hover:text-white transition">
                    Services
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard/widget" className="text-gray-400 hover:text-white transition">
                    Widget
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Für Kunden */}
          {user && user.role === 'customer' && (
            <div>
              <h4 className="text-white font-medium mb-4">Mein Konto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/customer/dashboard" className="text-gray-400 hover:text-white transition">
                    Meine Termine
                  </Link>
                </li>
                <li>
                  <Link to="/customer/booking" className="text-gray-400 hover:text-white transition">
                    Neuer Termin
                  </Link>
                </li>
                <li>
                  <Link to="/salons" className="text-gray-400 hover:text-white transition">
                    Anbieter finden
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Für nicht-angemeldete User */}
          {!user && (
            <div>
              <h4 className="text-white font-medium mb-4">Für Unternehmen</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/demo" className="text-gray-400 hover:text-white transition">
                    Demo ansehen
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-gray-400 hover:text-white transition">
                    Preise
                  </Link>
                </li>
                <li>
                  <Link to="/login/business" className="text-gray-400 hover:text-white transition">
                    Jetzt starten
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Legal */}
          <div>
            <h4 className="text-white font-medium mb-4">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/impressum" className="text-gray-400 hover:text-white transition">
                  Impressum
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="text-gray-400 hover:text-white transition">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link to="/agb" className="text-gray-400 hover:text-white transition">
                  AGB
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Stadt-Seiten für SEO */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <h4 className="text-white font-medium mb-4 text-sm">Anbieter in deiner Stadt</h4>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/salons/muenchen" className="text-xs text-gray-300 hover:text-white transition">
              München
            </Link>
            <Link to="/salons/berlin" className="text-xs text-gray-300 hover:text-white transition">
              Berlin
            </Link>
            <Link to="/salons/hamburg" className="text-xs text-gray-300 hover:text-white transition">
              Hamburg
            </Link>
            <Link to="/salons/koeln" className="text-xs text-gray-300 hover:text-white transition">
              Köln
            </Link>
            <Link to="/salons/frankfurt" className="text-xs text-gray-300 hover:text-white transition">
              Frankfurt
            </Link>
            <Link to="/salons/stuttgart" className="text-xs text-gray-300 hover:text-white transition">
              Stuttgart
            </Link>
            <Link to="/salons/duesseldorf" className="text-xs text-gray-300 hover:text-white transition">
              Düsseldorf
            </Link>
            <Link to="/salons/dortmund" className="text-xs text-gray-300 hover:text-white transition">
              Dortmund
            </Link>
            <Link to="/salons/essen" className="text-xs text-gray-300 hover:text-white transition">
              Essen
            </Link>
            <Link to="/salons/leipzig" className="text-xs text-gray-300 hover:text-white transition">
              Leipzig
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row md:justify-between gap-4">
          <p className="text-sm text-gray-300">
            © {currentYear} JN Business System. Alle Rechte vorbehalten.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition"
              aria-label="Folge uns auf Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition"
              aria-label="Verbinde dich mit uns auf LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
            <a
              href="mailto:info@jn-business-system.de"
              className="text-gray-300 hover:text-white transition"
              aria-label="Kontaktiere uns per E-Mail"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
