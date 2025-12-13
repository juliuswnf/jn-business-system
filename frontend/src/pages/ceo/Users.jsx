import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';
import { ceoAPI } from '../../utils/api';

export default function Users() {
  const { showNotification } = useNotification();
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
      setLoading(false);
    } catch (error) {
      showNotification('Fehler beim Laden der Benutzer', 'error');
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, isBanned) => {
    try {
      if (isBanned) {
        await ceoAPI.unbanUser(userId);
        showNotification('Benutzer entsperrt', 'success');
      } else {
        await ceoAPI.banUser(userId);
        showNotification('Benutzer gesperrt', 'success');
      }
      fetchUsers();
    } catch (error) {
      showNotification('Fehler beim Sperren/Entsperren', 'error');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Benutzerverwaltung</h1>
        <p className="text-slate-350">Alle Benutzer der Plattform verwalten</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Gesamt</p>
          <p className="text-3xl font-bold text-accent">{counts.total}</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Unternehmer</p>
          <p className="text-3xl font-bold text-blue-500">{counts.salon_owners}</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Mitarbeiter</p>
          <p className="text-3xl font-bold text-green-500">{counts.employees}</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Kunden</p>
          <p className="text-3xl font-bold text-purple-500">{counts.customers}</p>
        </div>
      </div>

      <div className="bg-secondary/50 border border-accent/20 rounded-lg overflow-hidden">
        <form onSubmit={handleSearch} className="p-6 border-b border-accent/20">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Benutzer suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-primary/50 border border-accent/20 text-white placeholder:text-slate-350"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-primary/50 border border-accent/20 text-white"
            >
              <option value="all">Alle Rollen</option>
              <option value="salon_owner">Unternehmer</option>
              <option value="employee">Mitarbeiter</option>
              <option value="customer">Kunde</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/80">
              Suchen
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Rolle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Unternehmen</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-350">
                    Keine Benutzer gefunden
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-accent/10 hover:bg-accent/5 transition">
                    <td className="px-6 py-4 text-white font-semibold">{user.name}</td>
                    <td className="px-6 py-4 text-slate-350">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent capitalize">
                        {user.role === 'salon_owner' ? 'Unternehmer' : user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-350">{user.companyName || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        !user.banned ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.banned ? 'Gesperrt' : 'Aktiv'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role !== 'ceo' && (
                        <button
                          onClick={() => handleBanUser(user.id, user.banned)}
                          className={`text-sm font-semibold ${user.banned ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}`}
                        >
                          {user.banned ? 'Entsperren' : 'Sperren'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
