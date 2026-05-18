import { lazy, Suspense, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Building2, CreditCard, Server } from 'lucide-react';
import useCeoDashboardData from '../hooks/useCeoDashboardData';
import DashboardShell from '../components/ceo-dashboard/DashboardShell';

const OverviewTab = lazy(() => import('../components/ceo-dashboard/tabs/OverviewTab'));
const ErrorsTab = lazy(() => import('../components/ceo-dashboard/tabs/ErrorsTab'));
const CustomersTab = lazy(() => import('../components/ceo-dashboard/tabs/CustomersTab'));
const SubscriptionsTab = lazy(() => import('../components/ceo-dashboard/tabs/SubscriptionsTab'));
const SystemControlTab = lazy(() => import('../components/ceo-dashboard/tabs/SystemControlTab'));

export default function CEODashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const {
    loading,
    error,
    stats,
    errors,
    customers,
    subscriptions,
    fetchDashboardData,
    markErrorAsResolved
  } = useCeoDashboardData();

  const unresolvedErrorCount = useMemo(
    () => errors.filter((entry) => !entry.resolved).length,
    [errors]
  );

  const navItems = useMemo(() => ([
    { id: 'overview', label: 'Uebersicht', icon: BarChart3 },
    { id: 'errors', label: 'Fehler', icon: AlertTriangle, badge: unresolvedErrorCount },
    { id: 'customers', label: 'Unternehmen', icon: Building2 },
    { id: 'subscriptions', label: 'Abonnements', icon: CreditCard },
    { id: 'system', label: 'System', icon: Server }
  ]), [unresolvedErrorCount]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            stats={stats}
            errors={errors}
            onOpenErrors={() => setActiveTab('errors')}
          />
        );
      case 'errors':
        return <ErrorsTab errors={errors} onResolve={markErrorAsResolved} />;
      case 'customers':
        return <CustomersTab customers={customers} />;
      case 'subscriptions':
        return <SubscriptionsTab subscriptions={subscriptions} />;
      case 'system':
        return <SystemControlTab />;
      default:
        return (
          <OverviewTab
            stats={stats}
            errors={errors}
            onOpenErrors={() => setActiveTab('errors')}
          />
        );
    }
  };

  return (
    <DashboardShell
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={loading}
      error={error}
      onRefresh={fetchDashboardData}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        }
      >
        {renderActiveTab()}
      </Suspense>
    </DashboardShell>
  );
}
