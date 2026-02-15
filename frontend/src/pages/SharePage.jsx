import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { viewShare, getShareInfo, deleteShare } from '../api';
import { useAuth } from '../contexts/AuthContext';
import PasswordPrompt from '../components/PasswordPrompt';
import TextDisplay from '../components/TextDisplay';
import FileDisplay from '../components/FileDisplay';

function SharePage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { getAuthToken } = useAuth();
  const hasLoadedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareInfo, setShareInfo] = useState(null);
  const [content, setContent] = useState(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isPermanentlyExpired, setIsPermanentlyExpired] = useState(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    loadShareInfo();
  }, [shareId]);

  const resetLoadedRef = () => {
    hasLoadedRef.current = false;
  };

  const loadShareInfo = async () => {
    try {
      setLoading(true);
      const info = await getShareInfo(shareId);
      setShareInfo(info.success ? info : null);

      if (!info.success || info.error) {
        setError(info.error || 'Content not found');
        return;
      }

      // Try to load content (will prompt for password if needed)
      if (info.isPasswordProtected) {
        setNeedsPassword(true);
      } else {
        await loadContent();
      }
    } catch (err) {
      setError(err.error || 'Failed to load share info');
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async (password = null) => {
    try {
      setLoading(true);
      setError('');

      const result = await viewShare(shareId, password);

      if (result.success) {
        setContent(result);
        setNeedsPassword(false);

        // fileUrl is now a Supabase signed URL (not base64 anymore)
        // No need to convert anything - the URL can be used directly
      } else {
        setError(result.error || 'Failed to load content');
      }

      if (result.contentType === 'text' && shareInfo?.isOneTimeView) {
        setIsPermanentlyExpired(true);
      }
    } catch (err) {
      if (err.error === 'Invalid password') {
        setError('Invalid password. Please try again.');
        setNeedsPassword(true);
      } else if (err.error === 'This link can only be viewed once') {
        setIsPermanentlyExpired(true);
        setError('This one-time link has already been viewed.');
      } else if (err.error === 'Maximum view count reached') {
        setContent(null);
        setError('Maximum view count reached. This share is no longer available.');
      } else {
        setError(err.error || 'Failed to load content');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (password) => {
    await loadContent(password);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this share?')) {
      try {
        const token = await getAuthToken();
        await deleteShare(shareId, token);
        navigate('/');
      } catch (err) {
        setError(err.error || 'Failed to delete');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading share...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="text-red-600 dark:text-red-400 text-center">
              <h2 className="text-2xl font-bold mb-2">❌ Error</h2>
              <p className="text-lg">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}

        {needsPassword && (
          <PasswordPrompt onSubmit={handlePasswordSubmit} isLoading={loading} />
        )}

        {content && !isPermanentlyExpired && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {content.contentType === 'text' && (
              <TextDisplay content={content} />
            )}

            {content.contentType === 'file' && (
              <FileDisplay content={content} />
            )}

            {shareInfo?.isOneTimeView && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ This is a one-time view link. The content will be deleted after this view.
                </p>
              </div>
            )}

            {shareInfo?.maxViewCount && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Views: {content.viewCount}/{shareInfo.maxViewCount}
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium py-2 rounded-lg transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}

        {isPermanentlyExpired && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              ⏰ Link Expired
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This one-time link has already been viewed and is no longer available.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SharePage;
