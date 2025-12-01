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
        <h1 className="text-3xl font-bold text-white mb-2">Companies Management</h1>
        <p className="text-slate-350">Manage all registered businesses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Total Companies</p>
          <p className="text-3xl font-bold text-accent">{companies.length}</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Active</p>
          <p className="text-3xl font-bold text-green-500">0</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Pending Approval</p>
          <p className="text-3xl font-bold text-yellow-500">0</p>
        </div>
        <div className="bg-secondary/50 border border-accent/20 p-4 rounded-lg">
          <p className="text-slate-350 text-sm mb-2">Suspended</p>
          <p className="text-3xl font-bold text-red-500">0</p>
        </div>
      </div>

      <div className="bg-secondary/50 border border-accent/20 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-accent/20">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search companies..."
              className="flex-1 px-4 py-2 rounded-lg bg-primary/50 border border-accent/20 text-white placeholder:text-slate-350"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-primary/50 border border-accent/20 text-white"
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
            <thead className="bg-primary/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Company Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Owner</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Revenue</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Employees</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-350">
                    No companies found
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company._id} className="border-t border-accent/10 hover:bg-accent/5 transition">
                    <td className="px-6 py-4 text-white font-semibold">{company.name}</td>
                    <td className="px-6 py-4 text-slate-350">{company.ownerName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        company.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        company.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">€{company.revenue?.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-350">{company.employeeCount}</td>
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
