'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../../lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const response = await authApi.changePassword(formData);
      setStatus('success');
      setMessage(response.message);
      // Optional: you might want to redirect the user after success.
    } catch (err: unknown) {
      setStatus('error');
      if (err instanceof Error) {
        setMessage(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setMessage((err as { message: string }).message);
      } else {
        setMessage('Failed to change password');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Change Password</h1>
        {status === 'success' ? (
          <div className="text-center">
            <p className="text-green-500 mb-4">{message}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-black">
            {status === 'error' && <p className="text-red-500 text-sm text-center">{message}</p>}
            <input
              type="password"
              placeholder="Current Password"
              required
              className="w-full p-2 border rounded"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            />
            <input
              type="password"
              placeholder="New Password (min 8 chars)"
              required
              minLength={8}
              className="w-full p-2 border rounded"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {status === 'loading' ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
