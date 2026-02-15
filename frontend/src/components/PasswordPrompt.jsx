import React, { useState } from 'react';

function PasswordPrompt({ onSubmit, isLoading }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 z-50">
      <div className="card-elevated max-w-md w-full p-8 sm:p-10 animate-slide-up">
        {/* Icon */}
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl animate-bounce-slow">🔒</span>
        </div>

        {/* Header */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Password Protected
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-center leading-relaxed">
          This share is protected with a password. Enter it below to access the content.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the password..."
              className="input-field"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full btn-primary py-3 text-lg font-semibold flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                Verifying...
              </>
            ) : (
              <>
                🔓 Unlock Share
              </>
            )}
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <span className="text-lg mt-px">ℹ️</span>
            <span>Your password is verified securely on the server without being stored.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PasswordPrompt;
