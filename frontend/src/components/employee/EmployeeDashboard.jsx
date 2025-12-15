import React, { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { employeeAPI, formatError } from '../../utils/api';
import { LoadingSpinner } from '../common';
import './EmployeeDashboard.css';

export default function EmployeeDashboard() {
  const { showNotification } = useNotification();
  const [stats, setStats] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, shiftsRes] = await Promise.all([
        employeeAPI.getMyStats(),
        employeeAPI.getMyShifts()
      ]);

      setStats(statsRes.data.stats);
      setShifts(shiftsRes.data.shifts);
    } catch (err) {
      setError(formatError(err));
      console.error('Error fetching employee data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      setExporting(true);
      let response;

      if (type === 'schedule') response = await employeeAPI.exportSchedule();
      else if (type === 'earnings') response = await employeeAPI.exportEarnings();
      else if (type === 'performance') response = await employeeAPI.exportPerformance();

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.${type === 'schedule' ? 'csv' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setExporting(false);
    }
  };

  const handleSwapShift = async (shiftId) => {
    try {
      await employeeAPI.swapShift({ shiftId, swapWithEmployeeId: 'emp123' });
      showNotification('Schichtwechsel beantragt!', 'success');
      fetchData();
    } catch (err) {
      setError(formatError(err));
    }
  };

  const handleChangeRequest = async (shiftId) => {
    try {
      await employeeAPI.requestShiftChange({
        shiftId,
        newStartTime: '10:00',
        newEndTime: '18:00',
        reason: 'Persönliche Gründe'
      });
      showNotification('Schichtänderung beantragt!', 'success');
      fetchData();
    } catch (err) {
      setError(formatError(err));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="employee-dashboard">
      <div className="dashboard-header">
        <h1>Mein Dashboard</h1>
        {error && <div className="alert alert-error">{error}</div>}
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-content">
              <h3>Termine diesen Monat</h3>
              <p className="stat-number">{stats?.appointmentsThisMonth || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-content">
              <h3>Bewertung</h3>
              <p className="stat-number">{stats?.avgRating || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-content">
              <h3>Monatliches Einkommen</h3>
              <p className="stat-number">€{stats?.monthlyEarnings || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"></div>
            <div className="stat-content">
              <h3>Kundenzufriedenheit</h3>
              <p className="stat-number">{stats?.customerSatisfaction || 0}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shifts Section */}
      <section className="shifts-section">
        <h2>Meine Schichten</h2>
        {shifts.length > 0 ? (
          <div className="table-responsive">
            <table className="shifts-table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Von</th>
                  <th>Bis</th>
                  <th>Status</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(shift => (
                  <tr key={shift.id}>
                    <td>{shift.date}</td>
                    <td>{shift.startTime}</td>
                    <td>{shift.endTime}</td>
                    <td>
                      <span className={`badge badge-${shift.status}`}>
                        {shift.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleSwapShift(shift.id)}
                        className="btn btn-sm btn-outline"
                      >
                        Tauschen
                      </button>
                      <button
                        onClick={() => handleChangeRequest(shift.id)}
                        className="btn btn-sm btn-outline"
                      >
                        Ändern
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-muted">Keine Schichten verfügbar</p>
        )}
      </section>

      {/* Export Section */}
      <section className="export-section">
        <h2>Berichte exportieren</h2>
        <div className="button-group">
          <button
            onClick={() => handleExport('schedule')}
            className="btn btn-primary"
            disabled={exporting}
          >
            {exporting ? 'wird exportiert...' : 'Zeitplan (CSV)'}
          </button>
          <button
            onClick={() => handleExport('earnings')}
            className="btn btn-primary"
            disabled={exporting}
          >
            {exporting ? 'wird exportiert...' : 'Einnahmen (PDF)'}
          </button>
          <button
            onClick={() => handleExport('performance')}
            className="btn btn-primary"
            disabled={exporting}
          >
            {exporting ? 'wird exportiert...' : 'Leistung (PDF)'}
          </button>
        </div>
      </section>
    </div>
  );
}
