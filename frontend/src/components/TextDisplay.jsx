import React, { useState } from 'react';

function TextDisplay({ content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">📝 Shared Text</h1>

      <div className="mb-4 flex gap-2">
        <button
          onClick={handleCopy}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
        </button>
      </div>

      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 max-h-96 overflow-y-auto">
        <pre className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words font-mono text-sm">
          {content.content}
        </pre>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        View count: {content.viewCount}
      </div>
    </div>
  );
}

export default TextDisplay;
