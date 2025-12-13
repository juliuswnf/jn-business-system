import { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, Upload, Download, Calendar, Users, FileText, Lock } from 'lucide-react';

/**
 * BAA Management Dashboard
 * Business Associate Agreement tracking for HIPAA compliance
 */
export default function BAAManagement() {
  const [baas, setBaas] = useState([]);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBaa, setSelectedBaa] = useState(null);

  useEffect(() => {
    fetchBaas();
    fetchComplianceStatus();
  }, []);

  const fetchBaas = async () => {
    try {
      const response = await fetch('/api/compliance/baas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBaas(data.baas);
      }
    } catch (error) {
      console.error('Failed to fetch BAAs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceStatus = async () => {
    try {
      const response = await fetch('/api/compliance/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setComplianceStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch compliance status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expiring_soon': return 'text-yellow-600 bg-yellow-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5" />;
      case 'expiring_soon': return <AlertTriangle className="w-5 h-5" />;
      case 'expired': return <XCircle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const handleUploadBaa = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const response = await fetch('/api/compliance/baas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setShowUploadModal(false);
        fetchBaas();
        fetchComplianceStatus();
      }
    } catch (error) {
      console.error('Failed to upload BAA:', error);
    }
  };

  const handleRenewBaa = async (baaId) => {
    try {
      const response = await fetch(`/api/compliance/baas/${baaId}/renew`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchBaas();
        fetchComplianceStatus();
      }
    } catch (error) {
      console.error('Failed to renew BAA:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            HIPAA Compliance Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage Business Associate Agreements and compliance status</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          Upload BAA
        </button>
      </div>

      {/* Compliance Status Cards */}
      {complianceStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active BAAs</p>
                <p className="text-2xl font-bold text-gray-900">{complianceStatus.activeBAAs || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{complianceStatus.expiringSoon || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Encryption Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complianceStatus.encryptionEnabled ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Trained Staff</p>
                <p className="text-2xl font-bold text-gray-900">
                  {complianceStatus.trainedStaff || 0}/{complianceStatus.totalStaff || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIPAA Compliance Checklist */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">HIPAA Compliance Checklist</h2>
        <div className="space-y-3">
          <ChecklistItem
            label="Encryption enabled for all PHI"
            completed={complianceStatus?.encryptionEnabled}
          />
          <ChecklistItem
            label="All BAAs signed and active"
            completed={complianceStatus?.allBaasActive}
          />
          <ChecklistItem
            label="Audit logging configured"
            completed={complianceStatus?.auditLoggingEnabled}
          />
          <ChecklistItem
            label="Staff HIPAA training completed"
            completed={complianceStatus?.staffTrainingComplete}
          />
          <ChecklistItem
            label="Breach notification plan in place"
            completed={complianceStatus?.breachPlanActive}
          />
          <ChecklistItem
            label="Data backup procedures active"
            completed={complianceStatus?.backupsEnabled}
          />
          <ChecklistItem
            label="Access controls implemented"
            completed={complianceStatus?.accessControlsEnabled}
          />
        </div>
      </div>

      {/* BAA List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Business Associate Agreements</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {baas.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No BAAs uploaded yet</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Upload your first BAA
              </button>
            </div>
          ) : (
            baas.map((baa) => (
              <div key={baa._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getStatusColor(baa.status)}`}>
                      {getStatusIcon(baa.status)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{baa.associateName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{baa.associateType}</p>
                      
                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Signed: {new Date(baa.signedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Expires: {new Date(baa.expirationDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {baa.status === 'expiring_soon' && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg inline-flex">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Expires in {baa.daysUntilExpiration} days</span>
                        </div>
                      )}

                      {baa.status === 'expired' && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg inline-flex">
                          <XCircle className="w-4 h-4" />
                          <span>Expired {Math.abs(baa.daysUntilExpiration)} days ago</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={baa.documentUrl}
                      download
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Download BAA"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    
                    {(baa.status === 'expiring_soon' || baa.status === 'expired') && (
                      <button
                        onClick={() => handleRenewBaa(baa._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Renew BAA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload BAA Document</h3>
            
            <form onSubmit={handleUploadBaa} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associate Name
                </label>
                <input
                  type="text"
                  name="associateName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Cloud Storage Provider Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Associate Type
                </label>
                <select
                  name="associateType"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  <option value="cloud_storage">Cloud Storage Provider</option>
                  <option value="payment_processor">Payment Processor</option>
                  <option value="email_provider">Email Service Provider</option>
                  <option value="analytics">Analytics Provider</option>
                  <option value="crm">CRM System</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signed Date
                </label>
                <input
                  type="date"
                  name="signedDate"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date
                </label>
                <input
                  type="date"
                  name="expirationDate"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BAA Document
                </label>
                <input
                  type="file"
                  name="document"
                  accept=".pdf,.doc,.docx"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload BAA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Checklist Item Component
 */
function ChecklistItem({ label, completed }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
        completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
      }`}>
        {completed ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <div className="w-3 h-3 rounded-full border-2 border-current"></div>
        )}
      </div>
      <span className={`text-sm ${completed ? 'text-gray-900' : 'text-gray-600'}`}>
        {label}
      </span>
    </div>
  );
}
