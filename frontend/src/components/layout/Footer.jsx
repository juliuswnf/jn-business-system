import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-zinc-900 text-zinc-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-800 flex items-center justify-center">
                <span className="font-semibold text-white">JN</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">JN Automation</h3>
                <p className="text-zinc-400 text-sm mt-1">Terminbuchungen für Studios & Dienstleister</p>
              </div>
            </Link>
          </div>

          <div>
            <h4 className="text-zinc-200 font-medium mb-3">Produkt</h4>
            <ul className="space-y-2 text-sm">
              <li><a className="hover:text-white" href="#features">Features</a></li>
              <li><Link to="/pricing" className="hover:text-white">Preise</Link></li>
              <li><a className="hover:text-white" href="#faq">FAQ</a></li>
              <li><a className="hover:text-white" href="/contact">Kontakt</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-zinc-200 font-medium mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/impressum" className="hover:text-white">Impressum</Link></li>
              <li><Link to="/datenschutz" className="hover:text-white">Datenschutzerklärung</Link></li>
              <li><Link to="/agb" className="hover:text-white">AGB</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-900 text-sm text-zinc-500 flex flex-col md:flex-row md:justify-between gap-4">
          <div>© {currentYear} JN Automation. Alle Rechte vorbehalten.</div>
          <div className="flex items-center gap-4">
            <a className="hover:text-white" href="https://www.facebook.com" target="_blank" rel="noreferrer">Facebook</a>
            <a className="hover:text-white" href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a>
            <a className="hover:text-white" href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
