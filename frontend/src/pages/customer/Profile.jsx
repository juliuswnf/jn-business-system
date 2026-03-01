import React, { useState, useEffect } from 'react';
import { customerAPI } from '../../utils/api';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit2, FiSave } from 'react-icons/fi';
import { DashboardLayout } from '../../components/layout';
import { LoadingSpinner, ButtonLoading } from '../../components/common';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';

/**
 * Customer Profile Page
 * Manage customer profile information
 */
const CustomerProfile = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await customerAPI.updateProfile(user?.id || 'me', formData);

      if (response.data.success) {
        showSuccess('Profil erfolgreich aktualisiert');
        setIsEditing(false);
      }
    } catch (error) {
      showError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="My Profile" breadcrumbs={[{ label: 'Profile', path: '/customer/profile' }]}>
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-zinc-900 rounded-lg transition"
            >
              <FiEdit2 size={20} />
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiUser className="inline mr-2" />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiMail className="inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiPhone className="inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiMapPin className="inline mr-2" />
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              />
            </div>

            {/* Save Button */}
            {isEditing && (
              <ButtonLoading
                type="submit"
                isLoading={isLoading}
                loadingText="Saving..."
                className="w-full"
              >
                <FiSave className="inline mr-2" />
                Save Changes
              </ButtonLoading>
            )}
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerProfile;
