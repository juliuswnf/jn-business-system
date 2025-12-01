import { useState } from 'react';

const WidgetGenerator = ({ salonSlug }) => {
  const [copied, setCopied] = useState(false);
  const widgetCode = `<iframe src="https://yourapp.com/widget/${salonSlug}" width="100%" height="600px" style="border: none;"></iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Widget Code generieren</h2>
      <div className="space-y-4">
        <textarea
          readOnly
          value={widgetCode}
          className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
        />
        <button
          onClick={copyToClipboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {copied ? 'Kopiert!' : 'Code kopieren'}
        </button>
      </div>
    </div>
  );
};

export default WidgetGenerator;
