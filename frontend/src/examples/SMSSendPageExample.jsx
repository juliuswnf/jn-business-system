import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UpgradeModal from '../components/UpgradeModal';
import api from '../utils/api';

/**
 * Example: SMS Send Page with Feature Gate & Upgrade Modal
 *
 * This example shows how to integrate the UpgradeModal component
 * when a user tries to access an Enterprise-only feature.
 */

export default function SMSSendPage() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  // Get current user tier (from context or auth state)
  const currentTier = 'professional'; // Example: user is on Professional tier

  const handleSendSMS = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await api.post('/sms/send', {
        to: phoneNumber,
        message,
      });

      if (response.data.success) {
        alert('SMS sent successfully!');
        setMessage('');
        setPhoneNumber('');
      }
    } catch (error) {
      // Feature gate blocked (403 Forbidden)
      if (error.response?.status === 403) {
        // Show upgrade modal
        setShowUpgradeModal(true);
      } else {
        alert('Error sending SMS: ' + error.response?.data?.message);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Send SMS</h1>

        <form onSubmit={handleSendSMS} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+49123456789"
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message..."
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg"
              rows={4}
              required
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send SMS'}
          </button>
        </form>

        {/* Upgrade Modal - Shows when feature is blocked */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature="smsNotifications"
          currentTier={currentTier}
        />
      </div>
    </div>
  );
}
