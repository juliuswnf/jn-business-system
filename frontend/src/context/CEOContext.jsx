import React, { createContext, useState, useCallback } from 'react';
import api, { ceoAPI } from '../utils/api';

export const CEOContext = createContext();

/**
 * CEOProvider Component
 * Manages CEO-specific data and operations
 * Analytics, business stats, reports
 */
export const CEOProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ceoAPI.getDashboard();

      if (response.data.success) {
        setDashboardData(response.data.data);
        return response.data.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to fetch dashboard';
      setError(errorMessage);
      console.error('Dashboard error:', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (dateRange = 'month') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ceoAPI.getAnalytics({ range: dateRange });

      if (response.data.success) {
        setAnalyticsData(response.data.data);
        return response.data.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to fetch analytics';
      setError(errorMessage);
      console.error('Analytics error:', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate report
  const generateReport = useCallback(async (reportType, filters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ceoAPI.generateCustomReport({ reportType, filters });

      if (response.data.success) {
        const newReport = response.data.data;
        setReports([...reports, newReport]);
        return newReport;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to generate report';
      setError(errorMessage);
      console.error('Report error:', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [reports]);

  // Export report
  const exportReport = useCallback(async (reportId, format = 'pdf') => {
    try {
      const response = await api.get(`/ceo/reports/${reportId}/export?format=${format}`, {
        responseType: 'blob'
      });

      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (err) {
      console.error('Export error:', err);
      return { success: false };
    }
  }, []);

  const value = {
    dashboardData,
    analyticsData,
    reports,
    isLoading,
    error,
    fetchDashboardData,
    fetchAnalytics,
    generateReport,
    exportReport
  };

  return (
    <CEOContext.Provider value={value}>
      {children}
    </CEOContext.Provider>
  );
};

export default CEOContext;
