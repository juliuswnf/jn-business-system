import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="pt-16"> {/* offset for fixed navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
