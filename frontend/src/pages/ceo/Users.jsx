import { useState, useEffect } from 'react';
import useNotification from '../../hooks/useNotification';
import { ceoAPI } from '../../utils/api';

const ROLE_CONFIG = {
  salon_owner: { label: 'Unternehmer', color: 'bg-indigo-100 text-indigo-700' },
  employee: { label: 'Mitarbeiter', color: 'bg-green-100 text-green-700' },
  customer: { label: 'Kunde', color: 'bg-purple-100 text-purple-700' },
  admin: { label: 'Admin', color: 'bg-amber-100 text-amber-700' },
  ceo: { label: 'CEO', color: 'bg-gray-900 text-white' },
};

export default function Users() {
  const { success, error: notifyError } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [counts, setCounts] = useState({ total: 0, admins: 0, employees: 0, customers: 0, salon_owners: 0 });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (searchTerm) params.search = searchTerm;
      const response = await ceoAPI.getUsers(params);
      setUsers(response.data.users || []);
      setCounts(response.data.counts || { total: 0, admins: 0, employees: 0, customers: 0, salon_owners: 0 });
    } catch {
      notifyError('Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, isBanned) => {
    try {
      if (isBanned) {
        await ceoAPI.unbanUser(userId);
        success('Benutzer entsperrt');
      } else {
        await ceoAPI.banUser(userId);
        success('Benutzer gesperrt');
      }
      fetchUsers();
    } catch {
      notifyError('Fehler beim Sperren/Entsperren');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Benutzerverwaltung</h1>
        <p className="text-sm text-gray-400 mt-1">Alle Benutzer der Plattform verwalten</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Gesamt</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{counts.total}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Unternehmer</p>
          <p className="text-2xl font-semibold tracking-tight text-indigo-600 mt-1">{counts.salon_owners}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mitarbeiter</p>
          <p className="text-2xl font-semibold tracking-tight text-green-600 mt-1">{counts.employees}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Kunden</p>
          <p className="text-2xl font-semibold tracking-tight text-purple-600 mt-1">{counts.customers}</p>
        </div>
      </div>

      {/* Filter + Search */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Benutzer suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Alle' },
              { key: 'salon_owner', label: 'Unternehmer' },
              { key: 'employee', label: 'Mitarbeiter' },
              { key: 'customer', label: 'Kunden' },
              { key: 'admin', label: 'Admin' },
            ].map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => setRoleFilter(f.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  roleFilter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button type="submit" className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition">
            Suchen
          </button>
        </form>

        {/* User list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 border-t-gray-900" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Keine Benutzer gefunden</p>
            <p className="text-gray-400 text-sm mt-1">Keine Treffer für diese Filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map(user => {
              const roleCfg = ROLE_CONFIG[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-600' };
              const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
              return (
                <div key={user.id} className="flex items-center gap-4 py-4 hover:bg-gray-50 -mx-5 px-5 rounded-xl transition">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-gray-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{user.name}</p>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${roleCfg.color}`}>
                        {roleCfg.label}
                      </span>
                      {user.banned && (
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-600">
                          Gesperrt
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-400">{user.companyName || ''}</p>
                    {user.role !== 'ceo' && (
                      <button
                        onClick={() => handleBanUser(user.id, user.banned)}
                        className={`mt-1 text-xs font-medium px-3 py-1 rounded-lg transition ${
                          user.banned
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        {user.banned ? 'Entsperren' : 'Sperren'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

