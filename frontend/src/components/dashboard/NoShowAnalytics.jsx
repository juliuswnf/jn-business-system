import { useEffect, useMemo, useState } from 'react';
import { noShowAPI } from '../../utils/api';

export default function NoShowAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await noShowAPI.getAnalytics();
        if (response.data?.success) {
          setAnalytics(response.data);
        }
      } catch (error) {
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const maxTrend = useMemo(() => {
    if (!analytics?.dailyTrend?.length) {
      return 0;
    }
    return Math.max(...analytics.dailyTrend.map((item) => item.noShows || 0));
  }, [analytics]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm text-gray-500">
        Lade No-Show Analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm text-gray-500">
        Keine Analytics verfuegbar.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-gray-900">No-Show Analytics</h3>
        <p className="text-sm text-gray-500 mt-1">Letzte 30 Tage im Ueberblick</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="No-Show Rate" value={`${analytics.overview?.noShowRate || 0}%`} />
        <MetricCard label="No-Shows" value={analytics.overview?.noShows || 0} />
        <MetricCard label="Abgeschlossen" value={analytics.overview?.completedBookings || 0} />
        <MetricCard
          label="Geschuetzter Umsatz"
          value={`EUR ${((analytics.overview?.protectedRevenueCents || 0) / 100).toFixed(2)}`}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">No-Show Trend</p>
        <div className="space-y-2">
          {(analytics.dailyTrend || []).slice(-10).map((item) => {
            const barWidth = maxTrend > 0 ? Math.max(6, Math.round((item.noShows / maxTrend) * 100)) : 0;
            return (
              <div key={item.day} className="grid grid-cols-[96px_1fr_56px] gap-2 items-center">
                <span className="text-xs text-gray-500">{item.day}</span>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-xs text-right text-gray-600">{item.noShows}</span>
              </div>
            );
          })}
        </div>
      </div>

      {(analytics.topRiskCustomers || []).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Top Risiko-Kunden</p>
          <div className="space-y-2">
            {analytics.topRiskCustomers.slice(0, 5).map((customer) => (
              <div key={customer.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                <span className="text-sm text-gray-800">{customer.fullName}</span>
                <span className="text-xs font-semibold text-orange-700">Score {customer.noShowScore}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold tracking-tight text-gray-900 mt-1">{value}</div>
    </div>
  );
}
