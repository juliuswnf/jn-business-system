import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { subscriptionAPI } from '../utils/api';

const planNames = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan');
  const planName = planNames[plan] || 'Premium';
  const [countdown, setCountdown] = useState(30);
  const [statusText, setStatusText] = useState('Zahlung wird bestätigt…');

  useEffect(() => {
    let polls = 0;
    const maxPolls = 15; // up to 30 seconds

    const checkStatus = async () => {
      polls++;
      try {
        const res = await subscriptionAPI.getStatus();
        if (res.data?.subscription?.status === 'active') {
          setStatusText('Abonnement aktiv – weiterleitung…');
          window.location.href = '/dashboard';
          return;
        }
      } catch {
        // ignore – keep polling
      }
      if (polls >= maxPolls) {
        window.location.href = '/dashboard';
      }
    };

    // Check immediately then every 2 seconds
    checkStatus();
    const pollInterval = setInterval(checkStatus, 2000);

    // Countdown display
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Zahlung erfolgreich!
        </h1>
        <p className="text-gray-600 mb-2">
          Ihr <strong>{planName}</strong>-Paket ist jetzt aktiv.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Sie erhalten in Kürze eine Bestätigungs-E-Mail.
        </p>

        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 mb-8">
          <p className="text-sm text-gray-500 mb-1">{statusText}</p>
          <p className="text-4xl font-bold text-gray-900">{countdown}s</p>
        </div>

        <Link
          to="/dashboard"
          className="inline-block px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition"
        >
          Jetzt zum Dashboard
        </Link>
      </div>
    </div>
  );
}
