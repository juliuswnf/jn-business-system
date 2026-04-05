import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import useNotification from '../../hooks/useNotification';

export default function Companies() {
  const { error: notifyError } = useNotification();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ceo/customers?limit=100');
      if (response.data.success) {
        setCompanies(response.data.customers || []);
      }
    } catch {
      notifyError('Fehler beim Laden der Unternehmen');
    } finally {
      setLoading(false);
    }
  };

  const filtered = companies.filter(c => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'active' ? c.status === 'active' :
      filter === 'trial' ? c.status === 'trial' :
      filter === 'inactive' ? c.status === 'inactive' : true;

    const matchesSearch = searchTerm === '' ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const activeCount = companies.filter(c => c.status === 'active').length;
  const trialCount = companies.filter(c => c.status === 'trial').length;
  const inactiveCount = companies.filter(c => c.status === 'inactive').length;

  const tierBadge = (plan) => {
    if (plan === 'enterprise') return 'bg-amber-500/15 text-amber-600';
    if (plan === 'professional') return 'bg-purple-500/15 text-purple-600';
    return 'bg-gray-100 text-gray-600';
  };
  const tierLabel = (plan) => {
    if (plan === 'enterprise') return 'Enterprise';
    if (plan === 'professional') return 'Professional';
    return 'Starter';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Unternehmen</h1>
        <p className="text-sm text-gray-400 mt-1">Alle registrierten Unternehmen auf der Plattform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Gesamt</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-900 mt-1">{companies.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Aktiv</p>
          <p className="text-2xl font-semibold tracking-tight text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Testphase</p>
          <p className="text-2xl font-semibold tracking-tight text-orange-500 mt-1">{trialCount}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Inaktiv</p>
          <p className="text-2xl font-semibold tracking-tight text-gray-400 mt-1">{inactiveCount}</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Unternehmen suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Alle' },
              { key: 'active', label: 'Aktiv' },
              { key: 'trial', label: 'Testphase' },
              { key: 'inactive', label: 'Inaktiv' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Keine Unternehmen gefunden</p>
            <p className="text-gray-400 text-sm mt-1">{companies.length === 0 ? 'Noch keine Unternehmen registriert.' : 'Keine Treffer für diese Filter.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(company => (
              <div key={company.id} className="flex items-center gap-4 py-4 hover:bg-gray-50 -mx-5 px-5 rounded-xl transition group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {company.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{company.name || 'Unbekannt'}</p>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold ${tierBadge(company.plan)}`}>
                      {tierLabel(company.plan)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">{company.email || '-'}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    company.status === 'active' ? 'bg-green-100 text-green-700' :
                    company.status === 'trial' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {company.status === 'active' ? 'Aktiv' : company.status === 'trial' ? 'Testphase' : 'Inaktiv'}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    seit {company.since ? new Date(company.since).toLocaleDateString('de-DE') : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
