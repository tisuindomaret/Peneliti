'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';

export default function EditPermitTypePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    validity_period_days: 365,
    numbering_pattern: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPermitType();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadPermitType = async () => {
    try {
      const res = await fetchWithAuth(`/permit-types/${id}`);
      if (res.error) throw new Error(res.error.message);

      setFormData({
        name: res.data.name,
        description: res.data.description,
        validity_period_days: res.data.validity_period_days,
        numbering_pattern: res.data.numbering_pattern,
      });
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetchWithAuth(`/permit-types/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          validity_period_days: Number(formData.validity_period_days),
        }),
      });

      if (res.error) throw new Error(res.error.message || 'Failed to update permit type');
      router.push('/admin/permit-types');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Permit Type</h1>
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
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
