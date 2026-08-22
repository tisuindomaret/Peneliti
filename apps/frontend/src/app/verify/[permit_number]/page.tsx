import React from 'react';
import { notFound } from 'next/navigation';

async function getPermitDetails(permitNumber: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const isToken = permitNumber.length > 30;
  const endpoint = isToken ? `/verify/token/${permitNumber}` : `/verify/${encodeURIComponent(permitNumber)}`;

  const res = await fetch(`${apiUrl}${endpoint}`, {
    next: { revalidate: 0 }
  });

  if (!res.ok) {
    return null;
  }
  return res.json();
}

export default async function VerifyPermitPage({ params }: { params: { permit_number: string } }) {
  const data = await getPermitDetails(params.permit_number);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-xl shadow-md border border-gray-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Public Permit Verification
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Official Research Permit Details
          </p>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize font-semibold">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                  data.status === 'active' ? 'bg-green-100 text-green-800' :
                  data.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {data.status as string}
                </span>
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Permit Number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                {data.permitNumber as string}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Applicant / Institution</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {data.applicantName as string} {data.institutionName !== 'N/A' && `(${data.institutionName as string})`}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Research Title</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 italic">
                {data.title as string}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Validity Period</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(data.validFrom as string).toLocaleDateString()} to {new Date(data.validUntil as string).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                This verification page displays only public information in accordance with privacy policies. Personal contact details are not exposed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
