'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api';

export default function PermitRequirementsPage() {
  const params = useParams();
  const id = params.id as string;

  const [permitType, setPermitType] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [reqForm, setReqForm] = useState({
    name: '',
    is_mandatory: true,
    accepted_formats: 'pdf,docx',
    max_size_mb: 5,
  });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/permit-types/${id}`);
      if (res.error) throw new Error(res.error.message);
      setPermitType(res.data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formats = reqForm.accepted_formats.split(',').map(f => f.trim().toLowerCase()).filter(f => f);
      const res = await fetchWithAuth(`/permit-types/${id}/requirements`, {
        method: 'POST',
        body: JSON.stringify({
          name: reqForm.name,
          is_mandatory: reqForm.is_mandatory,
          accepted_formats: formats,
          max_size_mb: Number(reqForm.max_size_mb),
        }),
      });

      if (res.error) throw new Error(res.error.message);
      setShowAddForm(false);
      setReqForm({ name: '', is_mandatory: true, accepted_formats: 'pdf,docx', max_size_mb: 5 });
      loadData();
    } catch (err: unknown) {
      alert(`Error: ${(err as Error).message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Requirements for {permitType?.name as string}</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showAddForm ? 'Cancel' : 'Add Requirement'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddRequirement} className="mb-6 p-4 border rounded bg-gray-50 shadow-sm space-y-4 max-w-2xl">
          <h2 className="text-lg font-semibold">New Requirement</h2>
          <div>
            <label className="block text-sm font-medium">Name (e.g. Research Proposal)</label>
            <input required type="text" className="mt-1 block w-full border rounded p-2" value={reqForm.name} onChange={(e) => setReqForm({ ...reqForm, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Accepted Formats (comma separated)</label>
            <input required type="text" className="mt-1 block w-full border rounded p-2" value={reqForm.accepted_formats} onChange={(e) => setReqForm({ ...reqForm, accepted_formats: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium">Max Size (MB)</label>
            <input required type="number" min="1" className="mt-1 block w-full border rounded p-2" value={reqForm.max_size_mb} onChange={(e) => setReqForm({ ...reqForm, max_size_mb: parseInt(e.target.value) })} />
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="is_mandatory" className="h-4 w-4" checked={reqForm.is_mandatory} onChange={(e) => setReqForm({ ...reqForm, is_mandatory: e.target.checked })} />
            <label htmlFor="is_mandatory" className="ml-2 block text-sm">Mandatory</label>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
        </form>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mandatory</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formats</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Size</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {((permitType?.requirements as Record<string, unknown>[]) || [])?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No requirements defined yet.</td>
              </tr>
            )}
            {((permitType?.requirements as Record<string, unknown>[]) || [])?.map((req: Record<string, unknown>) => (
              <tr key={req.id as string}>
                <td className="px-6 py-4 whitespace-nowrap">{req.name as string}</td>
                <td className="px-6 py-4 whitespace-nowrap">{req.is_mandatory ? 'Yes' : 'No'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{(req.accepted_formats as string[]).join(', ')}</td>
                <td className="px-6 py-4 whitespace-nowrap">{req.max_size_mb as number} MB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
