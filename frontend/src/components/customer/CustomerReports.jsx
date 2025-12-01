import React, { useState } from 'react';
import { customerAPI, formatError } from '../../utils/api';
import { LoadingSpinner } from '../common';
import './CustomerReports.css';

export default function CustomerReports() {
  const [reportType, setReportType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      if (reportType === 'dateRange') {
        if (!startDate || !endDate) {
          setError('Bitte wählen Sie Start- und Enddatum');
          setLoading(false);
          return;
        }
        const res = await customerAPI.getCustomerReportByDateRange({
          startDate,
          endDate
        });
        setReport(res.data.report);
      } else {
        const res = await customerAPI.generateCustomerReport();
        setReport(res.data.report);
      }
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      let response;

      if (format === 'csv') {
        response = await customerAPI.exportCustomersCSV();
      } else if (format === 'pdf') {
        response = await customerAPI.exportCustomersPDF();
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers.${format}`);
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

  return (
    <div className="customer-reports">
      <div className="reports-header">
        <h1>📊 Kundenberichte</h1>
        {error && <div className="alert alert-error">{error}</div>}
      </div>

      <div className="reports-container">
        <section className="report-filters">
          <h2>Berichtoptionen</h2>
          <div className="filter-group">
            <div className="form-group">
              <label>Berichtstyp:</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="form-select"
              >
                <option value="all">Alle Kunden</option>
                <option value="dateRange">Nach Datumsbereich</option>
              </select>
            </div>

            {reportType === 'dateRange' && (
              <>
                <div className="form-group">
                  <label>Von:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Bis:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'wird generiert...' : 'Bericht generieren'}
            </button>
          </div>
        </section>

        {report && (
          <section className="report-results">
            <h2>Berichtergebnisse</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Gesamtkunden</h4>
                <p className="stat-number">
                  {report.totalCustomersInRange || report.totalCustomers}
                </p>
              </div>
              <div className="stat-card">
                <h4>Aktive Kunden</h4>
                <p className="stat-number">{report.breakdown?.byStatus?.active || 0}</p>
              </div>
              <div className="stat-card">
                <h4>Inaktive Kunden</h4>
                <p className="stat-number">{report.breakdown?.byStatus?.inactive || 0}</p>
              </div>
              <div className="stat-card">
                <h4>Umsatz</h4>
                <p className="stat-number">€{report.revenue || 0}</p>
              </div>
            </div>

            <div className="export-actions">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="btn btn-outline"
              >
                📥 Als CSV exportieren
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="btn btn-outline"
              >
                📥 Als PDF exportieren
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
