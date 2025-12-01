import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';

export default function Customers() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // TODO: Integrate with API
      // const response = await customerAPI.getAll();
      // setCustomers(response.data.data);
      setLoading(false);
    } catch (error) {
      showNotification('Error loading customers', 'error');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Customers</h1>
          <p className="text-slate-350">Manage your customers and their bookings</p>
        </div>
        <button
          onClick={() => navigate('/company/customers/add')}
          className="px-6 py-2 rounded-lg bg-accent hover:bg-accent-light text-primary font-semibold transition duration-300"
        >
          + Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Total Customers</p>
          <p className="text-3xl font-bold text-accent">{customers.length}</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">New This Month</p>
          <p className="text-3xl font-bold text-green-500">0</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Avg Lifetime Value</p>
          <p className="text-3xl font-bold text-blue-500">€0</p>
        </div>
      </div>

      <div className="bg-secondary/50 border border-accent/20 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-accent/20">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-primary/50 border border-accent/20 text-white placeholder:text-slate-350"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Bookings</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Spent</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-350">
                    No customers yet
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="border-t border-accent/10 hover:bg-accent/5 transition">
                    <td className="px-6 py-4 text-white font-semibold">{customer.firstName} {customer.lastName}</td>
                    <td className="px-6 py-4 text-slate-350">{customer.email}</td>
                    <td className="px-6 py-4 text-slate-350">{customer.phone}</td>
                    <td className="px-6 py-4 text-white">{customer.bookingCount || 0}</td>
                    <td className="px-6 py-4 text-white">€{customer.totalSpent?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/company/customers/${customer._id}`)}
                        className="text-accent hover:text-accent-light text-sm font-semibold"
                      >
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
