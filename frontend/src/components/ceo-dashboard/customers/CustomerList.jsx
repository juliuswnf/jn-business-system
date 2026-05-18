export default function CustomerList({ customers, selectedCustomerId, onSelect, formatDate }) {
  return (
    <div className="space-y-3">
      {customers.map((customer) => (
        <div
          key={customer.id}
          onClick={() => onSelect(customer)}
          className={`bg-white/50 border rounded-xl p-4 cursor-pointer transition-all hover:bg-white ${
            selectedCustomerId === customer.id ? 'ring-2 ring-indigo-500 border-indigo-500/50' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {customer.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-gray-900 truncate">{customer.name || 'Unbekannt'}</h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  customer.plan === 'enterprise'
                    ? 'bg-amber-500/20 text-amber-500'
                    : customer.plan === 'professional'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-gray-50 text-gray-500'
                }`}>
                  {customer.plan === 'enterprise' ? 'Enterprise' : customer.plan === 'professional' ? 'Professional' : 'Starter'}
                </span>
              </div>
              <p className="text-gray-400 text-sm truncate">{customer.email || '-'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                customer.status === 'active'
                  ? 'bg-green-500/20 text-green-600'
                  : customer.status === 'trial'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'bg-gray-500/20 text-gray-500'
              }`}>
                {customer.status === 'active' ? 'Aktiv' : customer.status === 'trial' ? 'Testphase' : 'Inaktiv'}
              </span>
              <p className="text-gray-500 text-xs mt-1">seit {formatDate(customer.since)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
