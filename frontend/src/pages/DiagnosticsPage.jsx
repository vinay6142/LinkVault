// Save this as frontend/src/pages/DiagnosticsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState({
    supabaseUrl: null,
    supabaseKey: null,
    apiUrl: null,
    connected: false,
    authConfigured: false,
    error: null,
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const apiUrl = import.meta.env.VITE_API_URL;

      console.log('=== DIAGNOSTICS ===');
      console.log('Supabase URL:', supabaseUrl);
      console.log('Supabase Key:', supabaseKey ? 'SET ✓' : 'MISSING ✗');
      console.log('API URL:', apiUrl);

      if (!supabaseUrl || !supabaseKey) {
        setDiagnostics((prev) => ({
          ...prev,
          error: 'Missing Supabase credentials in .env file',
        }));
        return;
      }

      // Try to connect to Supabase
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Test connection by getting session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session test:', sessionError ? `ERROR: ${sessionError.message}` : 'Success ✓');

      // Test by trying to get user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('User test:', userError ? `Expected (no user logged in): ${userError.message}` : 'Unexpected (user found)');

      // Test API connection
      let apiConnected = false;
      try {
        const response = await fetch(`${apiUrl.replace('/api', '')}/health`);
        apiConnected = response.ok;
        console.log('API Health:', apiConnected ? 'SUCCESS ✓' : 'FAILED ✗');
      } catch (err) {
        console.log('API Health: ERROR -', err.message);
      }

      setDiagnostics({
        supabaseUrl: supabaseUrl ? `✓ Configured: ${supabaseUrl.substring(0, 30)}...` : '✗ Missing',
        supabaseKey: supabaseKey ? '✓ Configured' : '✗ Missing',
        apiUrl: apiUrl ? `✓ ${apiUrl}` : '✗ Missing',
        connected: !sessionError,
        authConfigured: !!supabaseUrl && !!supabaseKey,
        error: sessionError ? sessionError.message : null,
      });
    } catch (err) {
      console.error('Diagnostics error:', err);
      setDiagnostics((prev) => ({
        ...prev,
        error: err.message,
      }));
    }
  };

  const testSignup = async () => {
    try {
      const testEmail = `test-${Date.now()}@example.com`;
      console.log('Testing signup with email:', testEmail);

      const response = await fetch(`${import.meta.env.VITE_API_URL.replace('/api', '')}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'Test123456',
        }),
      });

      const data = await response.json();
      console.log('Signup test response:', data);

      alert(
        `Signup Test Result:\n\n` +
          `Status: ${response.status}\n` +
          `${response.ok ? '✓ Success' : '✗ Failed'}\n\n` +
          `Response: ${JSON.stringify(data, null, 2)}`
      );
    } catch (err) {
      console.error('Signup test error:', err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">🔍 LinkVault Diagnostics</h1>

        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuration Status</h2>

            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span>Supabase URL:</span>
                <span className="text-gray-600 dark:text-gray-400">{diagnostics.supabaseUrl || 'Loading...'}</span>
              </div>
              <div className="flex justify-between">
                <span>Supabase Key:</span>
                <span className="text-gray-600 dark:text-gray-400">{diagnostics.supabaseKey || 'Loading...'}</span>
              </div>
              <div className="flex justify-between">
                <span>API URL:</span>
                <span className="text-gray-600 dark:text-gray-400">{diagnostics.apiUrl || 'Loading...'}</span>
              </div>
              <div className="flex justify-between">
                <span>Supabase Connected:</span>
                <span className={diagnostics.connected ? 'text-green-600' : 'text-red-600'}>
                  {diagnostics.connected ? '✓ YES' : '✗ NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Auth Configured:</span>
                <span className={diagnostics.authConfigured ? 'text-green-600' : 'text-red-600'}>
                  {diagnostics.authConfigured ? '✓ YES' : '✗ NO'}
                </span>
              </div>
            </div>

            {diagnostics.error && (
              <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded">
                <p className="text-red-800 dark:text-red-200 font-mono text-xs">Error: {diagnostics.error}</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">Browser Console Info</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>Open Developer Tools: Press F12</li>
              <li>Go to Console tab</li>
              <li>Try to sign up and watch for errors</li>
              <li>Screenshot the error and share with me</li>
              <li>Check the Network tab for failed requests</li>
            </ol>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-700">
            <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-4">Server Logs Info</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
              <li>Check terminal where backend is running</li>
              <li>Look for "Storage upload error" or auth errors</li>
              <li>Screenshot those errors</li>
              <li>Share with me</li>
            </ol>
          </div>

          <button
            onClick={testSignup}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            🧪 Test Signup (Check Console)
          </button>

          <button
            onClick={runDiagnostics}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            🔄 Re-run Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiagnosticsPage;
