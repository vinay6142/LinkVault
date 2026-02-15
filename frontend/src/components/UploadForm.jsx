import React, { useState } from 'react';

function UploadForm({ onSubmit, isLoading }) {
  const [uploadType, setUploadType] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isOneTimeView, setIsOneTimeView] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState('');
  const [expiryDateTime, setExpiryDateTime] = useState('');
  const [maxViewCount, setMaxViewCount] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (uploadType === 'text' && !text.trim()) {
      newErrors.text = 'Please enter text to share';
    }

    if (uploadType === 'file' && !file) {
      newErrors.file = 'Please select a file to upload';
    }

    if (file && file.size > 50 * 1024 * 1024) {
      newErrors.file = 'File size must be less than 50MB';
    }

    if (expiryMinutes && isNaN(parseInt(expiryMinutes))) {
      newErrors.expiry = 'Expiry minutes must be a valid number';
    }

    if (expiryMinutes && parseInt(expiryMinutes) < 1) {
      newErrors.expiry = 'Expiry minutes must be at least 1';
    }

    if (expiryDateTime) {
      const selectedDateTime = new Date(expiryDateTime);
      const now = new Date();

      if (selectedDateTime <= now) {
        newErrors.expiryDateTime = 'Expiry date and time must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData = new FormData();

    if (uploadType === 'text') {
      formData.append('text', text);
    } else {
      formData.append('file', file);
    }

    if (password) {
      formData.append('password', password);
    }

    formData.append('isOneTimeView', isOneTimeView);

    // Send expiry based on what user provided
    if (expiryDateTime) {
      formData.append('expiryDateTime', expiryDateTime);
    } else if (expiryMinutes) {
      formData.append('expiryMinutes', parseInt(expiryMinutes));
    }

    if (maxViewCount) {
      formData.append('maxViewCount', parseInt(maxViewCount));
    }

    await onSubmit(formData);

    // Reset form
    setText('');
    setFile(null);
    setPassword('');
    setIsOneTimeView(false);
    setExpiryMinutes('');
    setExpiryDateTime('');
    setMaxViewCount('');
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gradient mb-2">Share Your Content</h2>
        <p className="text-gray-600 dark:text-gray-400">Choose what you'd like to share</p>
      </div>

      {/* Upload Type Selection - Enhanced */}
      <div className="space-y-3">
        <label className="label">What would you like to share?</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setUploadType('text')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              uploadType === 'text'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-3xl mb-2">📝</div>
            <div className="font-semibold text-gray-900 dark:text-white">Text</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Plain text</div>
          </button>
          <button
            type="button"
            onClick={() => setUploadType('file')}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              uploadType === 'file'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="text-3xl mb-2">📁</div>
            <div className="font-semibold text-gray-900 dark:text-white">File</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Any format</div>
          </button>
        </div>
      </div>

      {/* Text Input */}
      {uploadType === 'text' && (
        <div className="space-y-2 animate-fade-in">
          <label className="label">Text Content</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want to share..."
            className="input-field font-mono text-sm"
            rows="8"
          />
          {errors.text && <p className="error-message">{errors.text}</p>}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {text.length} characters
          </div>
        </div>
      )}

      {/* File Input */}
      {uploadType === 'file' && (
        <div className="space-y-2 animate-fade-in">
          <label className="label">Select File</label>
          <div className="border-3 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer block">
              {file ? (
                <div className="space-y-2">
                  <div className="text-4xl">✓</div>
                  <p className="text-gray-900 dark:text-white font-semibold">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-4xl">📤</div>
                  <p className="text-gray-900 dark:text-white font-semibold">Click to select file</p>
                  <p className="text-xs text-gray-500">Max 50MB</p>
                </div>
              )}
            </label>
          </div>
          {errors.file && <p className="error-message">{errors.file}</p>}
        </div>
      )}

      {/* Optional Settings */}
      <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="text-xl">⚙️</span> Optional Settings
        </h3>

        <div className="grid grid-cols-1 gap-6">
          {/* Password Protection */}
          <div className="space-y-2">
            <label className="label">🔐 Password (Optional)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set a password for this share..."
              className="input-field"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Anyone with the link needs this password to access the content
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <input
                type="checkbox"
                checked={isOneTimeView}
                onChange={(e) => setIsOneTimeView(e.target.checked)}
                className="w-5 h-5 accent-blue-500 cursor-pointer"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">⚡ One-time view</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Delete after first access</div>
              </div>
            </label>
          </div>

          {/* Max View Count */}
          <div className="space-y-2">
            <label className="label">👁️ Max View Count (Optional)</label>
            <input
              type="number"
              value={maxViewCount}
              onChange={(e) => setMaxViewCount(e.target.value)}
              placeholder="e.g., 5 (leave empty for unlimited)"
              min="1"
              className="input-field"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              How many times can this be viewed?
            </p>
          </div>

          {/* Expiry Time */}
          <div className="space-y-3">
            <label className="label">⏱️ Expiry Settings (Default: 10 minutes)</label>

            {/* DateTime Option */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Expire at specific time
              </label>
              <input
                type="datetime-local"
                value={expiryDateTime}
                onChange={(e) => {
                  setExpiryDateTime(e.target.value);
                  if (e.target.value) setExpiryMinutes('');
                }}
                className="input-field text-sm"
              />
              {errors.expiryDateTime && <p className="error-message">{errors.expiryDateTime}</p>}
            </div>

            <div className="text-center text-xs font-medium text-gray-400">OR</div>

            {/* Minutes Option */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Expire in N minutes
              </label>
              <input
                type="number"
                value={expiryMinutes}
                onChange={(e) => {
                  setExpiryMinutes(e.target.value);
                  if (e.target.value) setExpiryDateTime('');
                }}
                placeholder="e.g., 30"
                min="1"
                className="input-field text-sm"
              />
              {errors.expiry && <p className="error-message">{errors.expiry}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary text-lg py-4 font-bold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="inline-block animate-spin">⏳</span>
            Uploading...
          </>
        ) : (
          <>
            {uploadType === 'text' ? '📝 Share Text' : '📁 Share File'}
          </>
        )}
      </button>
    </form>
  );
}

export default UploadForm;
