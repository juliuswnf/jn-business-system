import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useNotification } from '../../hooks/useNotification';
import { paymentAPI, bookingAPI } from '../../utils/api';

export default function Payments() {
  const { showNotification } = useNotification();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, thisMonth: 0, pending: 0, refunded: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getHistory();
      const paymentsList = response.data.payments || response.data.data || [];
      if (filter !== 'all') {
        const filtered = paymentsList.filter(p => p.status === filter);
        setPayments(filtered);
      } else {
        setPayments(paymentsList);
      }
    } catch (error) {
      showNotification('Error loading payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await bookingAPI.getStats();
      if (response.data.stats) {
        setStats({
          totalRevenue: response.data.stats.totalRevenue || 0,
          thisMonth: 0,
          pending: 0,
          refunded: 0
        });
      }
    } catch (error) {
    }
  };

  if (loading) return <LoadingSpinner />;

  const filteredPayments = payments.filter(p =>
    p.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p._id?.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Payments</h1>
        <p className="text-zinc-400 text-sm md:text-base">Track all payments and transactions</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-8">
        <div className="bg-zinc-50 border border-zinc-200 p-3 md:p-4 rounded-lg">
          <p className="text-zinc-400 text-xs md:text-sm mb-1 md:mb-2">Total Revenue</p>
          <p className="text-2xl md:text-3xl font-bold text-zinc-900">€{stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 p-3 md:p-4 rounded-lg">
          <p className="text-zinc-400 text-xs md:text-sm mb-1 md:mb-2">This Month</p>
          <p className="text-2xl md:text-3xl font-bold text-green-500">€{stats.thisMonth.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 p-3 md:p-4 rounded-lg">
          <p className="text-zinc-400 text-xs md:text-sm mb-1 md:mb-2">Pending</p>
          <p className="text-2xl md:text-3xl font-bold text-yellow-500">€{stats.pending.toFixed(2)}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-200 p-3 md:p-4 rounded-lg">
          <p className="text-zinc-400 text-xs md:text-sm mb-1 md:mb-2">Refunded</p>
          <p className="text-2xl md:text-3xl font-bold text-red-500">€{stats.refunded.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-lg overflow-hidden">
        <div className="p-4 md:p-6 border-b border-zinc-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-slate-500 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-white/20"
            />
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                fetchPayments();
              }}
              className="px-4 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm md:text-base">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-zinc-900">Date</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-zinc-900 hidden sm:table-cell">Customer</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-zinc-900">Amount</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-zinc-900 hidden md:table-cell">Method</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-zinc-900">Status</th>
                <th className="px-3 md:px-6 py-3 md:py-4 text-left font-semibold text-zinc-900 hidden lg:table-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-3 md:px-6 py-8 text-center text-zinc-400">
                    {payments.length === 0 ? 'No payments yet' : 'No payments match your search'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="border-t border-zinc-200 hover:bg-zinc-100/50 transition">
                    <td className="px-3 md:px-6 py-3 md:py-4 text-zinc-900 text-sm md:text-base">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-slate-300 hidden sm:table-cell text-sm">
                      {payment.customerName || 'N/A'}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-zinc-900 font-semibold text-sm md:text-base">
                      €{(payment.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-slate-300 hidden md:table-cell text-sm capitalize">
                      {payment.paymentMethod || 'Card'}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
                        payment.status === 'completed' ? 'bg-green-500/20 text-green-600' :
                        payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                        payment.status === 'failed' ? 'bg-red-500/20 text-red-600' :
                        'bg-slate-500/20 text-slate-300'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 hidden lg:table-cell">
                      <button className="text-zinc-900 hover:text-zinc-900/80 font-semibold flex items-center gap-2">
                        <Eye className="w-4 h-4" /> View
                      </button>
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
