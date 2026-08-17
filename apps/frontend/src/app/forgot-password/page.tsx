'use client';

import { useState } from 'react';
import { authApi } from '../../lib/api';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const response = await authApi.forgotPassword({ email });
      setStatus('success');
      setMessage(response.message);
    } catch (err: unknown) {
      setStatus('error');
      if (err instanceof Error) {
        setMessage(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setMessage((err as { message: string }).message);
      } else {
        setMessage('Failed to request password reset');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Forgot Password</h1>
        {status === 'success' ? (
          <div className="text-center">
            <p className="text-green-500 mb-4">{message}</p>
            <Link href="/login" className="text-blue-500 hover:underline">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-black">
            {status === 'error' && <p className="text-red-500 text-sm text-center">{message}</p>}
            <p className="text-sm text-gray-600 text-center">
              Enter your email address and we will send you a link to reset your password.
            </p>
            <input
              type="email"
              placeholder="Email"
              required
              className="w-full p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="text-center mt-2">
              <Link href="/login" className="text-sm text-blue-500 hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
