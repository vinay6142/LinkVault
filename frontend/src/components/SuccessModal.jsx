import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SuccessModal({ data, onClose }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(data.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewShare = () => {
    const shareId = data.shareUrl.split('/share/')[1];
    navigate(`/share/${shareId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          ✅ Upload Successful!
        </h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share ID:</p>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg font-mono text-gray-900 dark:text-white">
              {data.shareId}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share Link:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={data.shareUrl}
                readOnly
                className="flex-1 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg font-mono text-sm text-gray-900 dark:text-white"
              />
              <button
                onClick={handleCopyLink}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ⏰ Expires at: {new Date(data.expiresAt).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleViewShare}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition-colors"
            >
              View Share
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Share the link above with anyone. No account needed to view!
          </p>
        </div>
      </div>
    </div>
  );
}

export default SuccessModal;
