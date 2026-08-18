'use client';

import { useState, useEffect } from 'react';
import { getApplications } from '../../../lib/api';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchApps = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (search) params.append('search', search);

      const data = await getApplications(token, params);
      setApplications(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]); // Only refetch automatically when status changes

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Application Review Queue</h1>

      <div className="flex gap-4 mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="admin_verification">Admin Verification</option>
          <option value="substantive_verification">Substantive Verification</option>
          <option value="awaiting_approval">Awaiting Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <input
          type="text"
          placeholder="Search by number or title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchApps()}
          className="border p-2 rounded flex-grow"
        />
        <button onClick={fetchApps} className="bg-blue-600 text-white px-4 py-2 rounded">
          Search
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b">Application Number</th>
              <th className="py-2 px-4 border-b">Title</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id as string}>
                <td className="py-2 px-4 border-b">{app.applicationNumber as string || 'Draft'}</td>
                <td className="py-2 px-4 border-b">{app.title as string}</td>
                <td className="py-2 px-4 border-b capitalize">{(app.status as string).replace('_', ' ')}</td>
                <td className="py-2 px-4 border-b">
                  <a href={`/admin/applications/${app.id as string}`} className="text-blue-600 hover:underline">
                    Review
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
