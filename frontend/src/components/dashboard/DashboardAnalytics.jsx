import React, { useEffect, useState } from 'react';
import { dashboardAPI, formatError } from '../../utils/api';
import { LoadingSpinner, StatsCard } from '../common';
import './DashboardAnalytics.css';

export default function DashboardAnalytics() {
  const [employeeStats, setEmployeeStats] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [growthForecast, setGrowthForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [empRes, revRes, growthRes] = await Promise.all([
        dashboardAPI.getEmployeeStats(),
        dashboardAPI.getRevenueByPeriod({ period }),
        dashboardAPI.getCustomerGrowthForecast({ months: 12 })
      ]);

      setEmployeeStats(empRes.data.stats);
      setRevenueData(revRes.data);
      setGrowthForecast(growthRes.data);
    } catch (err) {
      setError(formatError(err));
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="dashboard-analytics">
      <div className="analytics-header">
        <h1>📈 Dashboard Analytics</h1>
        {error && <div className="alert alert-error">{error}</div>}
      </div>

      <div className="analytics-container">
        {/* Employee Stats Section */}
        <section className="analytics-section">
          <h2>👥 Mitarbeiter Statistiken</h2>
          {employeeStats && (
            <>
              <div className="stats-grid">
                <StatsCard
                  icon="👥"
                  title="Gesamtmitarbeiter"
                  value={employeeStats.totalEmployees}
                />
                <StatsCard
                  icon="✅"
                  title="Aktive Mitarbeiter"
                  value={employeeStats.activeEmployees}
                />
                <StatsCard
                  icon="⏸️"
                  title="Inaktive Mitarbeiter"
                  value={employeeStats.inactiveEmployees}
                />
                <StatsCard
                  icon="⭐"
                  title="Durchschn. Bewertung"
                  value={`${employeeStats.avgRating}/5`}
                />
                <StatsCard
                  icon="📅"
                  title="Gesamttermine"
                  value={employeeStats.totalAppointments}
                />
                <StatsCard
                  icon="❌"
                  title="No-Show Rate"
                  value={employeeStats.noShowRate}
                />
              </div>

              {employeeStats.topPerformers && (
                <div className="top-performers">
                  <h3>🏆 Top Performer</h3>
                  <ul className="performers-list">
                    {employeeStats.topPerformers.map((emp, idx) => (
                      <li key={idx} className="performer-item">
                        <span className="performer-name">{emp.name}</span>
                        <span className="performer-stats">
                          {emp.rating} ⭐ • {emp.appointments} Termine
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>

        {/* Revenue Section */}
        <section className="analytics-section">
          <h2>💰 Einnahmen</h2>
          <div className="revenue-header">
            <label className="period-label">
              Zeitraum:
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="form-select"
              >
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
                <option value="monthly">Monatlich</option>
              </select>
            </label>
          </div>

          {revenueData && (
            <div className="revenue-content">
              <div className="revenue-summary">
                <div className="summary-card">
                  <h4>Gesamteinnahmen</h4>
                  <p className="summary-value">€{revenueData.totalRevenue}</p>
                </div>
              </div>

              <div className="revenue-table">
                <table>
                  <thead>
                    <tr>
                      <th>
                        {period === 'daily' ? 'Datum' : period === 'weekly' ? 'Woche' : 'Monat'}
                      </th>
                      <th>Einnahmen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.revenueData?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.date || item.week || item.month}</td>
                        <td>€{item.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Growth Forecast Section */}
        <section className="analytics-section">
          <h2>📊 Kundenwachstum Prognose</h2>
          {growthForecast && (
            <div className="forecast-content">
              <div className="forecast-summary">
                <div className="forecast-card">
                  <h4>Aktuelle Kunden</h4>
                  <p className="forecast-value">{growthForecast.currentCustomers}</p>
                </div>
                <div className="forecast-card">
                  <h4>Wachstumsrate</h4>
                  <p className="forecast-value">{growthForecast.growthRate}</p>
                </div>
              </div>

              <div className="forecast-table">
                <h3>Prognose nächste 12 Monate</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Monat</th>
                      <th>Prognostizierte Kunden</th>
                      <th>Vertrauen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {growthForecast.forecast?.slice(0, 6).map((month) => (
                      <tr key={month.month}>
                        <td>{month.month}</td>
                        <td>{month.projectedCustomers}</td>
                        <td>{month.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
