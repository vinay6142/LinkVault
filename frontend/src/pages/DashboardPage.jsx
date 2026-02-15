import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../api';

function DashboardPage() {
  const { user, profile, getAuthToken } = useAuth();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchUserShares();
  }, [user, navigate]);

  const fetchUserShares = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication failed');
        return;
      }

      const response = await fetch(`${getApiUrl()}/shares/user-shares`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setShares(data.shares);
      } else {
        setError(data.error || 'Failed to fetch shares');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch shares');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shareId) => {
    if (!window.confirm('Are you sure you want to delete this share?')) {
      return;
    }

    try {
      const token = await getAuthToken();
      const response = await fetch(`${getApiUrl()}/shares/delete/${shareId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setShares(shares.filter((s) => s.shareId !== shareId));
      } else {
        setError('Failed to delete share');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your shares...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Your Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, <span className="font-semibold">{profile?.display_name || 'User'}</span>!
          </p>
        </div>

        {error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="text-red-600 dark:text-red-400">
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Shares</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{shares.length}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Text Shares</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">
              {shares.filter((s) => s.contentType === 'text').length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm">File Shares</p>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {shares.filter((s) => s.contentType === 'file').length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Your Shares
          </h2>

          {shares.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven't created any shares yet.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Create Your First Share
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {shares.map((share) => (
                <div
                  key={share.shareId}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {share.contentType === 'text' ? '📝' : '📎'}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {share.contentType === 'text'
                            ? 'Text Share'
                            : share.fileName || 'File Share'}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <p className="font-medium">Views</p>
                          <p>{share.viewCount}</p>
                        </div>

                        <div>
                          <p className="font-medium">Expires</p>
                          <p>
                            {new Date(share.expiresAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div>
                          <p className="font-medium">Password</p>
                          <p>{share.isPasswordProtected ? '🔒 Yes' : 'No'}</p>
                        </div>

                        <div>
                          <p className="font-medium">One-time</p>
                          <p>{share.isOneTimeView ? '✓ Yes' : 'No'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          const shareUrl = `${window.location.origin}/share/${share.shareId}`;
                          navigator.clipboard.writeText(shareUrl);
                          alert('Share link copied!');
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Copy
                      </button>

                      <button
                        onClick={() => handleDelete(share.shareId)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
