'use client';

import { useState } from 'react';
import { authApi } from '../../lib/api';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    applicantType: 'individual',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await authApi.register(formData);
      setSuccess(response.message);
      // Let the user read the success message
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string }).message);
      } else {
        setError('Registration failed');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">Register</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {success ? (
          <div className="text-center">
            <p className="text-green-500 text-sm mb-4">{success}</p>
            <Link href="/login" className="text-blue-500 hover:underline">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-black">
            <input
              type="text"
              placeholder="Full Name"
              required
              className="w-full p-2 border rounded"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              required
              className="w-full p-2 border rounded"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="tel"
              placeholder="Phone (Optional)"
              className="w-full p-2 border rounded"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password (min 8 chars)"
              required
              minLength={8}
              className="w-full p-2 border rounded"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <select
              className="w-full p-2 border rounded"
              value={formData.applicantType}
              onChange={(e) => setFormData({ ...formData, applicantType: e.target.value })}
            >
              <option value="individual">Individual</option>
              <option value="institution">Institution</option>
            </select>
            <button
              type="submit"
              className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Register
            </button>
            <p className="text-sm text-center text-gray-600 mt-2">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-500 hover:underline">
                Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
