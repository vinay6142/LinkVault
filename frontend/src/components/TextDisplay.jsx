import React, { useState } from 'react';

function TextDisplay({ content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = content.content.split('\n').length;
  const charCount = content.content.length;

  return (
    <div className="space-y-4">
      {/* Copy Button */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`btn-primary click:scale-95 transition-all duration-200 ${
            copied
              ? 'bg-gradient-to-br from-green-500 to-green-600'
              : 'bg-gradient-to-br from-blue-600 to-blue-700'
          }`}
        >
          {copied ? (
            <>✓ Copied to Clipboard!</>
          ) : (
            <>📋 Copy Text</>
          )}
        </button>
      </div>

      {/* Text Content */}
      <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900/50">
        <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Text Content
          </div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 space-x-4">
            <span>{lineCount} line{lineCount !== 1 ? 's' : ''}</span>
            <span>{charCount} char{charCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <pre className="px-6 py-6 text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words font-mono text-sm max-h-96 overflow-y-auto leading-relaxed">
          {content.content}
        </pre>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Views</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{content.viewCount}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Type</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">Text</div>
        </div>
      </div>
    </div>
  );
}

export default TextDisplay;
