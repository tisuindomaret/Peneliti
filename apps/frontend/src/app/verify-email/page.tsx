'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { authApi } from '../../lib/api';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    authApi
      .verifyEmail({ token })
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err: unknown) => {
        setStatus('error');
        if (err instanceof Error) {
          setMessage(err.message);
        } else if (typeof err === 'object' && err !== null && 'message' in err) {
          setMessage((err as { message: string }).message);
        } else {
          setMessage('Verification failed. The token may be expired or invalid.');
        }
      });
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow text-center">
        <h1 className="text-2xl font-bold">Email Verification</h1>
        {status === 'loading' && <p className="text-gray-600">{message}</p>}
        {status === 'success' && (
          <div>
            <p className="text-green-500 mb-4">{message}</p>
            <Link
              href="/login"
              className="text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div>
            <p className="text-red-500 mb-4">{message}</p>
            <Link href="/login" className="text-blue-500 hover:underline">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
