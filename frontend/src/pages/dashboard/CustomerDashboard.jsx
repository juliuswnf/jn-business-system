import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react';

const CustomerDashboard = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Simulate loading bookings
    setTimeout(() => {
      setBookings([
        // Example bookings - in production these would come from API
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link 
          to="/customer/booking"
          className="bg-white text-black p-6 rounded-xl hover:bg-gray-100 transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Neuen Termin buchen</h3>
              <p className="text-black/70 text-sm">Finden Sie Ihren nächsten Termin</p>
            </div>
            <ChevronRight className="group-hover:translate-x-1 transition" />
          </div>
        </Link>
        
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-gray-400" size={24} />
            <h3 className="font-semibold text-white">Kommende Termine</h3>
          </div>
          <p className="text-3xl font-bold text-white">{bookings.filter(b => new Date(b.date) > new Date()).length}</p>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-gray-400" size={24} />
            <h3 className="font-semibold text-white">Vergangene Termine</h3>
          </div>
          <p className="text-3xl font-bold text-white">{bookings.filter(b => new Date(b.date) <= new Date()).length}</p>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Ihre Termine</h2>
        
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-400 mb-2">Keine Termine gefunden</h3>
            <p className="text-gray-500 mb-6">Sie haben noch keine Termine gebucht.</p>
            <Link 
              to="/customer/booking"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition"
            >
              Jetzt Termin buchen
              <ChevronRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div 
                key={booking.id}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-700/50 rounded-lg flex items-center justify-center">
                    <Calendar className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{booking.service}</h4>
                    <p className="text-sm text-gray-400">{booking.date} um {booking.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="text-gray-500" size={16} />
                  <span className="text-sm text-gray-400">{booking.location}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Kontoinformationen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
            <User className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-400">Name</p>
              <p className="font-medium text-white">{user?.name || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm text-gray-400">E-Mail</p>
              <p className="font-medium text-white">{user?.email || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
