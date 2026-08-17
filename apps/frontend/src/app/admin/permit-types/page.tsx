'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';

export default function PermitTypesPage() {
  const [permitTypes, setPermitTypes] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadPermitTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPermitTypes = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/permit-types');
      if (res.error) throw new Error(res.error.message || 'Failed to load permit types');
      setPermitTypes(res.data || []);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const endpoint = `/permit-types/${id}/${currentStatus ? 'deactivate' : 'activate'}`;
      const res = await fetchWithAuth(endpoint, { method: 'PATCH' });
      if (res.error) throw new Error(res.error.message);
      loadPermitTypes();
    } catch (err: unknown) {
      alert(`Error toggling status: ${(err as Error).message}`);
    }
  };

  if (loading) return <div>Loading permit types...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Permit Types</h1>
        <button
          onClick={() => router.push('/admin/permit-types/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create New Permit Type
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity (Days)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {permitTypes.map((pt: Record<string, unknown>) => (
              <tr key={pt.id as string}>
                <td className="px-6 py-4 whitespace-nowrap">{pt.name as string} {pt.name === 'Demo Research Permit' && <span className="text-xs text-gray-400 italic ml-2">(Sample)</span>}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pt.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {pt.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{pt.validity_period_days as string}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => router.push(`/admin/permit-types/${pt.id}/edit`)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                  <button onClick={() => router.push(`/admin/permit-types/${pt.id}/requirements`)} className="text-blue-600 hover:text-blue-900 mr-4">Requirements</button>
                  <button onClick={() => toggleStatus(pt.id as string, pt.is_active as boolean)} className="text-gray-600 hover:text-gray-900">
                    {pt.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
