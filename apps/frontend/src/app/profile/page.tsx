'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { profileApi, institutionsApi, filesApi } from '@/lib/api';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  // Form State
  const [identityNumber, setIdentityNumber] = useState('');
  const [address, setAddress] = useState('');
  const [affiliation, setAffiliation] = useState('');

  // Institution Form State
  const [instName, setInstName] = useState('');
  const [instAddress, setInstAddress] = useState('');
  const [instContact, setInstContact] = useState('');
  const [instOfficer, setInstOfficer] = useState('');
  const [legalDoc, setLegalDoc] = useState<File | null>(null);

  const router = useRouter();

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      setIdentityNumber((data as { identityNumber?: string }).identityNumber || '');
      setAddress((data as { address?: string }).address || '');
      setAffiliation((data as { affiliation?: string }).affiliation || '');

      const institution = (
        data as {
          institution?: {
            name?: string;
            address?: string;
            contact?: string;
            responsibleOfficer?: string;
          };
        }
      ).institution;
      if (institution) {
        setInstName(institution.name || '');
        setInstAddress(institution.address || '');
        setInstContact(institution.contact || '');
        setInstOfficer(institution.responsibleOfficer || '');
      }
    } catch (err) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Failed to load profile');
      if (errorObj.message === 'Unauthorized') {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let institutionId = (profile?.institution as { id?: string })?.id;

      // Handle institution creation if applicant type is institution and no inst exists yet
      if (
        (profile?.user as { applicantType?: string })?.applicantType === 'institution' &&
        !institutionId
      ) {
        let legalDocumentFileId = undefined;
        if (legalDoc) {
          const fileData = await filesApi.uploadFile(legalDoc);
          legalDocumentFileId = fileData.id;
        }

        const newInst = await institutionsApi.createInstitution({
          name: instName,
          address: instAddress,
          contact: instContact,
          responsibleOfficer: instOfficer,
          legalDocumentFileId,
        });
        institutionId = newInst.id;
      }

      await profileApi.updateProfile({
        identityNumber,
        address,
        affiliation,
        ...(institutionId ? { institutionId } : {}),
      });

      setSuccess('Profile updated successfully');
      await loadProfile();
    } catch (err) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading profile...</div>;
  }

  const isInstitution =
    (profile?.user as { applicantType?: string })?.applicantType === 'institution';

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Applicant Profile</h1>

      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">{error}</div>}
      {success && <div className="mb-4 text-green-600 bg-green-50 p-3 rounded">{success}</div>}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Individual Profile Fields */}
        <h2 className="text-xl font-semibold mt-4">Personal Information</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="identityNumber">
            Identity Number
          </label>
          <input
            id="identityNumber"
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            value={identityNumber}
            onChange={(e) => setIdentityNumber(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="address">
            Address
          </label>
          <textarea
            id="address"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="affiliation">
            Affiliation
          </label>
          <input
            id="affiliation"
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
          />
        </div>

        {/* Institution Profile Fields */}
        {isInstitution && (
          <>
            <h2 className="text-xl font-semibold mt-8 border-t pt-4">Institution Information</h2>

            {profile?.institution && (
              <div className="mb-4 text-sm text-gray-500 italic">
                Institution details have already been submitted. To update them, please contact
                support.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="instName">
                Institution Name
              </label>
              <input
                id="instName"
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-100"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                disabled={!!profile?.institution}
                required={!profile?.institution}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="instAddress">
                Institution Address
              </label>
              <textarea
                id="instAddress"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-100"
                value={instAddress}
                onChange={(e) => setInstAddress(e.target.value)}
                rows={3}
                disabled={!!profile?.institution}
                required={!profile?.institution}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="instContact">
                Institution Contact
              </label>
              <input
                id="instContact"
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-100"
                value={instContact}
                onChange={(e) => setInstContact(e.target.value)}
                disabled={!!profile?.institution}
                required={!profile?.institution}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="instOfficer">
                Responsible Officer
              </label>
              <input
                id="instOfficer"
                type="text"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-100"
                value={instOfficer}
                onChange={(e) => setInstOfficer(e.target.value)}
                disabled={!!profile?.institution}
                required={!profile?.institution}
              />
            </div>

            {!profile?.institution && (
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="legalDoc">
                  Legal Document Upload (PDF/Image)
                </label>
                <input
                  id="legalDoc"
                  type="file"
                  className="mt-1 block w-full"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setLegalDoc(e.target.files[0]);
                    }
                  }}
                />
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
