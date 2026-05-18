export default function SubscriptionList({ subscriptions, selectedSubscriptionId, onSelect, formatDate }) {
  return (
    <div className="space-y-3">
      {subscriptions.map((subscription) => (
        <div
          key={subscription.id}
          onClick={() => onSelect(subscription)}
          className={`bg-white/50 border rounded-xl p-4 cursor-pointer transition-all hover:bg-white ${
            selectedSubscriptionId === subscription.id ? 'ring-2 ring-indigo-500 border-indigo-500/50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                subscription.plan === 'enterprise'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                  : subscription.plan === 'professional'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{subscription.customer || 'Unbekannt'}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    subscription.plan === 'enterprise'
                      ? 'bg-amber-500/20 text-amber-500'
                      : subscription.plan === 'professional'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-gray-50 text-gray-500'
                  }`}>
                    {subscription.plan}
                  </span>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className="text-gray-400 text-sm">seit {formatDate(subscription.startDate)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${subscription.amount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                {subscription.amount > 0 ? `EUR ${subscription.amount}` : 'EUR 0'}
                <span className="text-xs font-normal text-gray-400">/Mo</span>
              </p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                subscription.status === 'active'
                  ? 'bg-green-500/20 text-green-600'
                  : subscription.status === 'trial'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-red-500/20 text-red-600'
              }`}>
                {subscription.status === 'active' ? 'Aktiv' : subscription.status === 'trial' ? 'Testphase' : 'Gekuendigt'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
