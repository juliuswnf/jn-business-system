import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { noShowAPI } from '../../utils/api';

export default function NoShowWidget() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const fetchNoShowDashboard = async () => {
      try {
        const response = await noShowAPI.getDashboard();
        if (response.data?.dashboard) {
          setDashboard(response.data.dashboard);
        }
      } catch (error) {
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNoShowDashboard();
  }, []);

  if (loading) {
    return (
      <section className="bg-white border border-gray-100 rounded-2xl p-5 text-sm text-gray-500">
        Lade No-Show Widget...
      </section>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">No-Show Killer</h2>
          <p className="text-xs text-gray-500 mt-0.5">Live Ueberblick fuer Ausfall-Schutz</p>
        </div>
        <Link to="/dashboard/settings" className="text-xs font-medium text-gray-700 hover:text-black">
          Einstellungen
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <WidgetStat label="No-Shows Monat" value={dashboard.noShowsThisMonth || 0} />
        <WidgetStat label="Offene Bestaetigungen" value={dashboard.pendingConfirmations || 0} />
        <WidgetStat label="Risiko-Kunden" value={dashboard.highRiskCustomers || 0} />
        <WidgetStat label="Anzahlungen aktiv" value={dashboard.depositRequiredUpcoming || 0} />
      </div>

      {(dashboard.recentNoShows || []).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Letzte No-Shows</p>
          <div className="space-y-2">
            {dashboard.recentNoShows.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50">
                <div className="min-w-0">
                  <p className="text-sm text-gray-800 truncate">{item.customerName}</p>
                  <p className="text-xs text-gray-500 truncate">{item.serviceName}</p>
                </div>
                <div className="text-xs text-gray-500 ml-3 shrink-0">
                  {new Date(item.bookingDate).toLocaleDateString('de-DE')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function WidgetStat({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold tracking-tight text-gray-900 mt-1">{value}</div>
    </div>
  );
}
