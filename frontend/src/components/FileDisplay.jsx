import React, { useState } from 'react';

function FileDisplay({ content }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!content.fileUrl) {
      alert('File URL not available. Please try again later.');
      return;
    }

    setIsDownloading(true);
    try {
      // fileUrl is now a Supabase signed URL
      // Download directly from the signed URL
      const response = await fetch(content.fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file (HTTP ${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = content.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download file: ${error.message}`);
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
