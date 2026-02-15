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

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">📁 Shared File</h1>

      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center mb-6">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {content.fileName}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Size: {formatFileSize(content.fileSize)}
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-sm">
          Type: {content.fileMimeType}
        </p>
      </div>

      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        {isDownloading ? '⏳ Downloading...' : '⬇️ Download File'}
      </button>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        View count: {content.viewCount}
      </div>
    </div>
  );
}

export default FileDisplay;
