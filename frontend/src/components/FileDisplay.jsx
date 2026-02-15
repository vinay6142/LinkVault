import React, { useState } from 'react';

function FileDisplay({ content }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!content.fileUrl) {
      alert('❌ File URL not available. Please refresh the page and try again.');
      return;
    }

    setIsDownloading(true);
    try {
      // Fetch file with proper error handling and CORS support
      const response = await fetch(content.fileUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
        mode: 'cors', // Enable CORS
        credentials: 'omit', // Don't send cookies for Supabase URLs
      });

      if (!response.ok) {
        // Provide detailed error messages based on HTTP status
        if (response.status === 400) {
          throw new Error(
            'Invalid download request (HTTP 400).\n\n' +
            'Possible causes:\n' +
            '• File link expired\n' +
            '• Supabase bucket not public\n' +
            '• File has been deleted\n\n' +
            'Try: Refresh page or request a new share link'
          );
        } else if (response.status === 403) {
          throw new Error('Access denied (HTTP 403). You may not have permission to download this file.');
        } else if (response.status === 404) {
          throw new Error('File not found (HTTP 404). It may have been deleted or is no longer available.');
        } else if (response.status === 500) {
          throw new Error('Server error (HTTP 500) while processing your download. Please try again.');
        } else {
          throw new Error(`Download failed with HTTP ${response.status}. Please try again.`);
        }
      }

      // Check if we got valid content
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) === 0) {
        throw new Error('File is empty. It may have been corrupted or deleted.');
      }

      // Download the file
      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Downloaded file is empty. Please try again.');
      }

      // Create download link and trigger download
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = content.fileName || 'download';
      document.body.appendChild(link);

      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);

      alert('✓ File downloaded successfully!');
    } catch (error) {
      console.error('❌ Download error:', error);
      alert(`❌ Failed to download file:\n\n${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    const mime = content.fileMimeType || '';

    if (mime.includes('pdf')) return '📄';
    if (mime.includes('image')) return '🖼️';
    if (mime.includes('video')) return '🎬';
    if (mime.includes('audio')) return '🎵';
    if (mime.includes('archive') || mime.includes('zip') || mime.includes('rar') || mime.includes('gzip')) return '📦';
    if (mime.includes('document') || mime.includes('word')) return '📝';
    if (mime.includes('spreadsheet') || mime.includes('excel')) return '📊';

    return '📁';
  };

  return (
    <div>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-10 text-center mb-6 border border-blue-100 dark:border-gray-600">
        <div className="text-7xl mb-4 animate-bounce-slow inline-block">
          {getFileIcon()}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 break-words">
          {content.fileName}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {formatFileSize(content.fileSize)}
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-sm">
          Type: {content.fileMimeType}
        </p>
      </div>

      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full btn-success text-lg font-semibold py-4 flex items-center justify-center gap-2 mb-4"
      >
        {isDownloading ? (
          <>
            <span className="inline-block animate-spin">⏳</span>
            Downloading...
          </>
        ) : (
          <>
            ⬇️ Download File
          </>
        )}
      </button>

      {/* File Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Size</div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400 truncate">
            {formatFileSize(content.fileSize)}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Views</div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{content.viewCount}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Type</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400 truncate">File</div>
        </div>
      </div>
    </div>
  );
}

export default FileDisplay;
