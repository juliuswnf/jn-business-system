import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNotification } from '../../hooks/useNotification';

export default function Companies() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      // TODO: Integrate with API
      // const response = await companyAPI.getAll();
      // setCompanies(response.data.data);
      setLoading(false);
    } catch (error) {
      showNotification('Error loading companies', 'error');
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Companies Management</h1>
        <p className="text-zinc-400">Manage all registered businesses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-secondary/50 border border-zinc-200 p-4 rounded-lg">
          <p className="text-zinc-400 text-sm mb-2">Total Companies</p>
          <p className="text-3xl font-bold text-accent">{companies.length}</p>
        </div>
        <div className="bg-secondary/50 border border-zinc-200 p-4 rounded-lg">
          <p className="text-zinc-400 text-sm mb-2">Active</p>
          <p className="text-3xl font-bold text-green-500">0</p>
        </div>
        <div className="bg-secondary/50 border border-zinc-200 p-4 rounded-lg">
          <p className="text-zinc-400 text-sm mb-2">Pending Approval</p>
          <p className="text-3xl font-bold text-yellow-500">0</p>
        </div>
        <div className="bg-secondary/50 border border-zinc-200 p-4 rounded-lg">
          <p className="text-zinc-400 text-sm mb-2">Suspended</p>
          <p className="text-3xl font-bold text-red-500">0</p>
        </div>
      </div>

      <div className="bg-secondary/50 border border-zinc-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-zinc-200">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search companies..."
              className="flex-1 px-4 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-900"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Company Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Owner</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Revenue</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Employees</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-zinc-400">
                    No companies found
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company._id} className="border-t border-zinc-200 hover:bg-zinc-50 transition">
                    <td className="px-6 py-4 text-zinc-900 font-semibold">{company.name}</td>
                    <td className="px-6 py-4 text-zinc-400">{company.ownerName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        company.status === 'active' ? 'bg-green-500/20 text-green-600' :
                        company.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                        'bg-red-500/20 text-red-600'
                      }`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-900">€{company.revenue?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-zinc-400">{company.employeeCount}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/ceo/company/${company._id}`)}
                        className="text-accent hover:text-accent-light text-sm font-semibold"
                      >
                        View Details
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
