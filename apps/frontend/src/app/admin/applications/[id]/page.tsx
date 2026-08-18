'use client';

import { useState, useEffect } from 'react';
import {
  getApplication,
  getApplicationHistory,
  reviewApplication,
  requestRevision,
  forwardApplication,
  approveApplication,
  rejectApplication,
} from '../../../../lib/api';

export default function ReviewApplicationPage({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [application, setApplication] = useState<any | null>(null);
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state for actions
  const [reason, setReason] = useState('');
  const [actionList, setActionList] = useState(''); // comma separated for simplicity in UI

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const appData = await getApplication(params.id, token);
      const histData = await getApplicationHistory(params.id, token);

      setApplication(appData);
      setHistory(histData);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleAction = async (
    actionFn: (id: string, payload: Record<string, unknown>, token: string) => Promise<unknown>,
    payload: Record<string, unknown>,
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await actionFn(params.id, payload, token);
      await fetchData();
      setReason('');
      setActionList('');
    } catch (err: unknown) {
      alert((err as Error).message || 'Action failed');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!application) return <div className="p-6 text-red-600">{error || 'Not found'}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Application Details: {application.applicationNumber || 'Draft'}
        </h1>
        <span className="px-3 py-1 bg-gray-200 rounded capitalize">
          {application.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Information</h2>
          <div className="bg-white p-4 border rounded space-y-2 mb-4">
            <p>
              <strong>Title:</strong> {application.title}
            </p>
            <p>
              <strong>Field:</strong> {application.fieldTopic}
            </p>
            <p>
              <strong>Location:</strong> {application.location}
            </p>
            <p>
              <strong>PI:</strong> {application.principalInvestigator}
            </p>
            <p>
              <strong>Objective:</strong> {application.objective}
            </p>
          </div>
          <h2 className="text-xl font-semibold mb-2">Documents</h2>
          <div className="bg-white p-4 border rounded space-y-2">
            {application.documents?.length === 0 ? (
              <p className="text-gray-500">No documents uploaded.</p>
            ) : (
              <ul className="space-y-4">
                {application.documents?.map((doc: Record<string, unknown>) => (
                  <li
                    key={doc.id as string}
                    className="border-b pb-2 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {(doc.requirement as Record<string, string>)?.name || 'Document'}
                      </p>
                      <p className="text-sm text-gray-500">Status: {doc.reviewStatus as string}</p>
                      <a
                        href={`/api/v1/files/${doc.fileId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 text-sm hover:underline"
                      >
                        View File
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleAction(reviewApplication, {
                            documentReviews: [{ documentId: doc.id, status: 'accepted' }],
                          })
                        }
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          handleAction(reviewApplication, {
                            documentReviews: [{ documentId: doc.id, status: 'needs_revision' }],
                          })
                        }
                        className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                      >
                        Needs Revision
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">History</h2>
          <div className="bg-white p-4 border rounded h-64 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-gray-500">No history</p>
            ) : (
              <ul className="space-y-3">
                {history.map((h) => (
                  <li key={h.id as string} className="border-b pb-2">
                    <p className="text-sm text-gray-500">
                      {new Date(h.createdAt as string).toLocaleString()}
                    </p>
                    <p className="font-medium">
                      {h.fromStatus as string} &rarr; {h.toStatus as string}
                    </p>
                    {Boolean(h.note) && (
                      <p className="text-gray-700 italic text-sm">{h.note as string}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>

        <div className="flex flex-wrap gap-4 bg-white p-4 border rounded">
          <div className="w-full space-y-2 border-b pb-4">
            <label className="font-semibold block">Notes / Reason / Conditions</label>
            <textarea
              className="w-full border p-2 rounded"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter note, rejection reason, or approval conditions..."
            />
          </div>

          <button
            onClick={() => handleAction(reviewApplication, { note: reason })}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add Review Note
          </button>

          <button
            onClick={() => handleAction(forwardApplication, { note: reason })}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Forward Application
          </button>

          <button
            onClick={() => handleAction(approveApplication, { conditions: reason })}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Approve (Official)
          </button>

          <button
            onClick={() => handleAction(rejectApplication, { reason: reason })}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Reject (Official)
          </button>

          <div className="w-full mt-4 pt-4 border-t">
            <label className="font-semibold block">Revision Actions (comma separated)</label>
            <input
              type="text"
              className="w-full border p-2 rounded mb-2"
              value={actionList}
              onChange={(e) => setActionList(e.target.value)}
              placeholder="e.g. Update objective, Upload ID"
            />
            <button
              onClick={() => {
                const list = actionList
                  .split(',')
                  .map((s) => ({ field: 'general', instruction: s.trim() }))
                  .filter((a) => a.instruction);
                handleAction(requestRevision, {
                  reason: reason || 'Revision required',
                  actionList: list,
                });
              }}
              className="bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Request Revision
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
