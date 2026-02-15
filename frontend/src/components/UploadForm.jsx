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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Upload Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          What would you like to share?
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="text"
              checked={uploadType === 'text'}
              onChange={(e) => setUploadType(e.target.value)}
              className="w-4 h-4"
            />
            <span className="text-gray-700 dark:text-gray-300">📝 Text</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="file"
              checked={uploadType === 'file'}
              onChange={(e) => setUploadType(e.target.value)}
              className="w-4 h-4"
            />
            <span className="text-gray-700 dark:text-gray-300">📁 File</span>
          </label>
        </div>
      </div>

      {/* Text Input */}
      {uploadType === 'text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Text Content
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want to share..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows="8"
          />
          {errors.text && <p className="text-red-500 text-sm mt-1">{errors.text}</p>}
        </div>
      )}

      {/* File Input */}
      {uploadType === 'file' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select File
          </label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer">
              {file ? (
                <div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">📄 {file.name}</p>
                  <p className="text-gray-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">Click to select file</p>
                  <p className="text-gray-500 text-sm">Max 50MB</p>
                </div>
              )}
            </label>
          </div>
          {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
        </div>
      )}

      {/* Optional Settings */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Optional Settings</h3>

        {/* Password Protection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password (Optional)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Set a password for this share..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* One Time View */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isOneTimeView}
              onChange={(e) => setIsOneTimeView(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-gray-700 dark:text-gray-300">One-time view only</span>
          </label>
        </div>

        {/* Max View Count */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max View Count (Optional)
          </label>
          <input
            type="number"
            value={maxViewCount}
            onChange={(e) => setMaxViewCount(e.target.value)}
            placeholder="e.g., 5 (leave empty for unlimited)"
            min="1"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Expiry Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expiry Settings (Optional - Default: 10 minutes)
          </label>

          {/* Option 1: Expiry Date and Time */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Specify expiry date and time
            </label>
            <input
              type="datetime-local"
              value={expiryDateTime}
              onChange={(e) => {
                setExpiryDateTime(e.target.value);
                if (e.target.value) setExpiryMinutes(''); // Clear minutes if datetime is set
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {errors.expiryDateTime && <p className="text-red-500 text-sm mt-1">{errors.expiryDateTime}</p>}
          </div>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-4">OR</div>

          {/* Option 2: Expiry Minutes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Specify expiry in minutes
            </label>
            <input
              type="number"
              value={expiryMinutes}
              onChange={(e) => {
                setExpiryMinutes(e.target.value);
                if (e.target.value) setExpiryDateTime(''); // Clear datetime if minutes is set
              }}
              placeholder="e.g., 30 (will expire in 30 minutes)"
              min="1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {errors.expiry && <p className="text-red-500 text-sm mt-1">{errors.expiry}</p>}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors duration-200"
      >
        {isLoading ? 'Uploading...' : uploadType === 'text' ? 'Share Text' : 'Share File'}
      </button>
    </form>
  );
}

export default UploadForm;
