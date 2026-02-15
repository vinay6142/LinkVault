import React, { useState } from 'react';

function PasswordPrompt({ onSubmit, isLoading }) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
        🔒 Password Protected
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
        This share is password protected. Please enter the password to continue.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !password}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors"
        >
          {isLoading ? 'Verifying...' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}

export default PasswordPrompt;
