'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { authApi } from '../../lib/api';
import Link from 'next/link';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage('Missing reset token. Please use the link from your email.');
      return;
    }

    setStatus('loading');
    try {
      const response = await authApi.resetPassword({ token, newPassword: password });
      setStatus('success');
      setMessage(response.message);
    } catch (err: unknown) {
      setStatus('error');
      if (err instanceof Error) {
        setMessage(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setMessage((err as { message: string }).message);
      } else {
        setMessage('Failed to reset password');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>
        {status === 'success' ? (
          <div className="text-center">
            <p className="text-green-500 mb-4">{message}</p>
            <Link
              href="/login"
              className="text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-black">
            {status === 'error' && <p className="text-red-500 text-sm text-center">{message}</p>}
            {!token && status !== 'error' && (
              <p className="text-red-500 text-sm text-center mb-4">
                Warning: No reset token found in URL.
              </p>
            )}
            <input
              type="password"
              placeholder="New Password (min 8 chars)"
              required
              minLength={8}
              className="w-full p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={status === 'loading' || !token}
              className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {status === 'loading' ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
