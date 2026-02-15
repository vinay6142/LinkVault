import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { viewShare, getShareInfo, deleteShare } from '../api';
import { useAuth } from '../contexts/AuthContext';
import PasswordPrompt from '../components/PasswordPrompt';
import TextDisplay from '../components/TextDisplay';
import FileDisplay from '../components/FileDisplay';

// Helper function to check if user can delete
function canUserDelete(user, shareInfo) {
  if (!user) return false;
  if (!shareInfo || !shareInfo.userId) return false;
  return user.id === shareInfo.userId;
}

function SharePage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { getAuthToken, user } = useAuth();
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

        // For one-time views, mark as expired after showing content briefly
        // This gives the user time to see and download/copy the content (30 seconds)
        if (shareInfo?.isOneTimeView) {
          setTimeout(() => {
            setIsPermanentlyExpired(true);
          }, 30000); // Wait 30 seconds - same as backend deletion delay
        }
      } else {
        setError(result.error || 'Failed to load content');
      }
    } catch (err) {
      if (err.error === 'Password required') {
        setError('A password is required to access this share.');
        setNeedsPassword(true);
      } else if (err.error === 'Invalid password') {
        setError('❌ Invalid password. Please try again.');
        setNeedsPassword(true);
      } else if (err.error === 'This link can only be viewed once') {
        setIsPermanentlyExpired(true);
        setError('⏰ This one-time link has already been viewed. The content has been deleted.');
      } else if (err.error === 'Maximum view count reached') {
        setContent(null);
        setError('📊 This share has reached its maximum view count and is no longer available.');
      } else if (err.error === 'Content not found or has expired' || err.error === 'Content has expired') {
        setError('⏰ This share has expired and is no longer available.');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading share...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 py-12 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 animate-slide-up">
            <div className="card-elevated p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
                  <button
                    onClick={() => navigate('/')}
                    className="btn-primary"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {needsPassword && (
          <div className="animate-slide-up">
            <PasswordPrompt onSubmit={handlePasswordSubmit} isLoading={loading} />
          </div>
        )}

        {content && !isPermanentlyExpired && (
          <div className="animate-slide-up space-y-6">
            {/* Main Content Card */}
            <div className="card-elevated overflow-hidden">
              {/* Header with gradient */}
              <div className="h-32 bg-gradient-primary relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </div>
              </div>

              {/* Content Area */}
              <div className="px-8 py-8 sm:px-10 sm:py-10">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                    {content.contentType === 'text' ? '📄' : '📁'} {content.contentType === 'text' ? 'Text Content' : 'File Download'}
                  </h1>
                  {shareInfo?.isOneTimeView && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                      ⚡ One-time
                    </span>
                  )}
                </div>

                {/* Content Display */}
                <div className="mb-8">
                  {content.contentType === 'text' && (
                    <TextDisplay content={content} />
                  )}

                  {content.contentType === 'file' && (
                    <FileDisplay content={content} />
                  )}
                </div>

                {/* Info Section */}
                <div className="space-y-4">
                  {shareInfo?.isOneTimeView && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        This is a one-time view link. The content will be deleted after this view.
                      </p>
                    </div>
                  )}

                  {shareInfo?.maxViewCount && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Views remaining</p>
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{shareInfo.maxViewCount - content.viewCount}/{shareInfo.maxViewCount}</p>
                      </div>
                      <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(0, ((shareInfo.maxViewCount - content.viewCount) / shareInfo.maxViewCount) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {canUserDelete(user, shareInfo) && (
                <button
                  onClick={handleDelete}
                  className="btn-danger flex-1"
                >
                  🗑️ Delete Share
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className={`btn-secondary ${canUserDelete(user, shareInfo) ? 'flex-1' : 'w-full'}`}
              >
                ← Back to Home
              </button>
            </div>
          </div>
        )}

        {isPermanentlyExpired && (
          <div className="animate-slide-up">
            <div className="card-elevated p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⏰</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Link Expired
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                This one-time link has already been viewed and is no longer available.
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                Create a New Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SharePage;
