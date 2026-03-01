import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action = null }) {
  return (
    <div className="text-center py-12 px-4">
      {Icon && <Icon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />}
      <h3 className="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
      <p className="text-zinc-400 mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:opacity-95 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
