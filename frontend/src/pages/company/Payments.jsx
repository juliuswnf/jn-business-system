import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';

export default function Payments() {
  const { showNotification } = useNotification();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // TODO: Integrate with API
      // const response = await paymentAPI.getHistory();
      // setPayments(response.data.data);
      setLoading(false);
    } catch (error) {
      showNotification('Error loading payments', 'error');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Payments</h1>
        <p className="text-slate-350">Track all payments and transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-accent">€0</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">This Month</p>
          <p className="text-3xl font-bold text-green-500">€0</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Pending</p>
          <p className="text-3xl font-bold text-yellow-500">€0</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Refunded</p>
          <p className="text-3xl font-bold text-red-500">€0</p>
        </div>
      </div>

      <div className="bg-secondary/50 border border-accent/20 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-accent/20">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search payments..."
              className="flex-1 px-4 py-2 rounded-lg bg-primary/50 border border-accent/20 text-white placeholder:text-slate-350"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-primary/50 border border-accent/20 text-white"
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
          <table className="w-full">
            <thead className="bg-primary/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Method</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-350">
                    No payments yet
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="border-t border-accent/10 hover:bg-accent/5 transition">
                    <td className="px-6 py-4 text-white">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-350">{payment.customerName}</td>
                    <td className="px-6 py-4 text-white font-semibold">€{payment.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-350 capitalize">{payment.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        payment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        payment.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-accent hover:text-accent-light text-sm font-semibold">
                        View
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
