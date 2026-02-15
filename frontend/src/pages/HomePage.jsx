import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadShare } from '../api';
import { useAuth } from '../contexts/AuthContext';
import UploadForm from '../components/UploadForm';
import SuccessModal from '../components/SuccessModal';

function HomePage() {
  const navigate = useNavigate();
  const { user, getAuthToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleUpload = async (formData) => {
    setLoading(true);
    setError('');
    try {
      const token = user ? await getAuthToken() : null;
      const result = await uploadShare(formData, token);
      setSuccessData(result);
    } catch (err) {
      setError(err.error || 'Failed to upload. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Share Safely with LinkVault
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Upload files or text and share them securely with a unique link. Automatic expiry ensures your content is safe.
          </p>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-2xl">🔒</span>
              <span>Secure Links</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-2xl">⏰</span>
              <span>Auto Expiry</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className="text-2xl">🔗</span>
              <span>Shareable URLs</span>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
              {error}
            </div>
          )}
          <UploadForm onSubmit={handleUpload} isLoading={loading} />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">📝 Text Sharing</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Share snippets, notes, or code with instant copy-to-clipboard functionality.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">📁 File Sharing</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload any file up to 50MB. Recipients can download directly from your secure link.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🛡️ Privacy</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Content expires after 10 minutes by default. No public listing, no indexing by search engines.
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successData && (
        <SuccessModal data={successData} onClose={handleCloseSuccess} />
      )}
    </div>
  );
}

export default HomePage;
