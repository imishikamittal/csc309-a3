// Generated using Claude
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import Avatar from '../../components/Avatar';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function UserProfilePage() {
  const { user, refreshUser } = useAuth();
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState('');
  const [uploadSection, setUploadSection] = useState('');
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [avatarTs, setAvatarTs] = useState(Date.now());

  const toggleAvailability = async () => {
    setAvailError('');
    setAvailLoading(true);
    try {
      await api.patch('/users/me/available', { available: !user.available });
      await refreshUser();
    } catch (err) {
      const msg = err.response?.data?.error;
      setAvailError(msg || 'Cannot update availability.');
    } finally {
      setAvailLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const endpoint = uploadSection === 'avatar' ? '/users/me/avatar' : '/users/me/resume';
      await api.put(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadSuccess(`${uploadSection === 'avatar' ? 'Avatar' : 'Resume'} uploaded successfully!`);
      setFile(null);
      if (uploadSection === 'avatar') setAvatarTs(Date.now());
      await refreshUser();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed. Check file type and size.');
    } finally {
      setUploadLoading(false);
    }
  };

  const approvedQuals = [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title mb-0">My Profile</h1>
        <Link to="/profile/edit" className="btn-secondary">Edit Profile</Link>
      </div>

      <div className="card">
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar
              src={user.avatar ? `${user.avatar}?t=${avatarTs}` : null}
              name={`${user.first_name} ${user.last_name}`}
              size="xl"
            />
            <button
              onClick={() => setUploadSection(uploadSection === 'avatar' ? '' : 'avatar')}
              className="text-xs link"
            >
              {uploadSection === 'avatar' ? 'Cancel' : 'Change avatar'}
            </button>
            {user.avatar && uploadSection !== 'avatar' && (
              <button
                onClick={async () => {
                  try {
                    await api.patch('/users/me', { avatar: null });
                    setAvatarTs(Date.now());
                    await refreshUser();
                  } catch {}
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Remove avatar
              </button>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className={user.suspended ? 'badge-red' : 'badge-green'}>
                {user.suspended ? 'Suspended' : 'Active'}
              </span>
              <span className={user.available ? 'badge-teal' : 'badge-gray'}>
                {user.available ? '✓ Available' : 'Not available'}
              </span>
            </div>

            <div className="mt-4">
              <button
                onClick={toggleAvailability}
                disabled={availLoading || user.suspended}
                className={user.available ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
                title={user.suspended ? 'Suspended accounts cannot set availability' : ''}
              >
                {availLoading ? '…' : user.available ? 'Set unavailable' : 'Set available'}
              </button>
              {availError && <p className="error-text mt-1">{availError}</p>}
            </div>
          </div>
        </div>

        {uploadSection === 'avatar' && (
          <form onSubmit={handleUpload} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <label className="label">Upload avatar (PNG or JPEG, max 10MB)</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="input"
                onChange={e => setFile(e.target.files[0])}
              />
              <button type="submit" className="btn-primary shrink-0" disabled={uploadLoading || !file}>
                {uploadLoading ? '…' : 'Upload'}
              </button>
            </div>
            {uploadError && <p className="error-text">{uploadError}</p>}
            {uploadSuccess && <p className="text-sm text-green-600 dark:text-green-400">{uploadSuccess}</p>}
          </form>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Personal Information</h2>
        <dl className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Phone', value: user.phone_number || '-' },
            { label: 'Address', value: user.postal_address || '-' },
            { label: 'Birthday', value: user.birthday || '-' },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{label}</dt>
              <dd className="text-gray-900 dark:text-white mt-1">{value}</dd>
            </div>
          ))}
        </dl>
        {user.biography && (
          <div className="mt-4">
            <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Biography</dt>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{user.biography}</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Resume</h2>
          <button
            onClick={() => setUploadSection(uploadSection === 'resume' ? '' : 'resume')}
            className="text-sm link"
          >
            {uploadSection === 'resume' ? 'Cancel' : user.resume ? 'Replace resume' : 'Upload resume'}
          </button>
        </div>
        {user.resume ? (
          <a
            href={`${BASE_URL}${user.resume}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
          >
            📄 View resume
          </a>
        ) : (
          <p className="text-gray-400 text-sm">No resume uploaded yet.</p>
        )}

        {uploadSection === 'resume' && (
          <form onSubmit={handleUpload} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <label className="label">Upload resume (PDF only, max 10MB)</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="application/pdf"
                className="input"
                onChange={e => setFile(e.target.files[0])}
              />
              <button type="submit" className="btn-primary shrink-0" disabled={uploadLoading || !file}>
                {uploadLoading ? '…' : 'Upload'}
              </button>
            </div>
            {uploadError && <p className="error-text">{uploadError}</p>}
            {uploadSuccess && <p className="text-sm text-green-600 dark:text-green-400">{uploadSuccess}</p>}
          </form>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Qualifications</h2>
          <Link to="/qualifications" className="text-sm link">Manage qualifications →</Link>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          View and manage your qualification requests for different position types.
        </p>
      </div>
    </div>
  );
}
