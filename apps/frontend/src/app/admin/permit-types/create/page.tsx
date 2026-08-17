'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';

export default function CreatePermitTypePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: false,
    validity_period_days: 365,
    numbering_pattern: '{PREFIX}/{TYPE}/{YYYY}/{SEQ}',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetchWithAuth('/permit-types', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          validity_period_days: Number(formData.validity_period_days),
        }),
      });

      if (res.error) throw new Error(res.error.message || 'Failed to create permit type');
      router.push('/admin/permit-types');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create Permit Type</h1>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 shadow rounded">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Validity Period (Days)</label>
          <input
            type="number"
            min="1"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            value={formData.validity_period_days}
            onChange={(e) => setFormData({ ...formData, validity_period_days: parseInt(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Numbering Pattern (Placeholder)</label>
          <input
            type="text"
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            value={formData.numbering_pattern}
            onChange={(e) => setFormData({ ...formData, numbering_pattern: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">Example: {'{PREFIX}/{TYPE}/{YYYY}/{SEQ}'}</p>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
            Activate immediately
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
