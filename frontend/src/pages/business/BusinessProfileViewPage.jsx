// Generated using Claude
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import Avatar from '../../components/Avatar';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function BusinessProfileViewPage() {
  const { user, refreshUser } = useAuth();
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.put('/businesses/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadSuccess('Avatar uploaded!');
      setFile(null);
      setShowAvatarUpload(false);
      await refreshUser();
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title mb-0">Business Profile</h1>
        <Link to="/business/profile/edit" className="btn-secondary">Edit Profile</Link>
      </div>

      <div className="card">
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar src={user.avatar} name={user.business_name} size="xl" />
            <button onClick={() => setShowAvatarUpload(s => !s)} className="text-xs link">
              {showAvatarUpload ? 'Cancel' : 'Change avatar'}
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.business_name}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={user.verified ? 'badge-green' : 'badge-yellow'}>
                {user.verified ? '✓ Verified' : 'Pending Verification'}
              </span>
              <span className={user.activated ? 'badge-teal' : 'badge-gray'}>
                {user.activated ? 'Active' : 'Inactive'}
              </span>
            </div>
            {!user.verified && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Your account is pending admin verification. You cannot post jobs until verified.
              </p>
            )}
          </div>
        </div>

        {showAvatarUpload && (
          <form onSubmit={handleUpload} className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <label className="label">Upload avatar (PNG or JPEG, max 10MB)</label>
            <div className="flex gap-2">
              <input type="file" accept="image/png,image/jpeg" className="input" onChange={e => setFile(e.target.files[0])} />
              <button type="submit" className="btn-primary shrink-0" disabled={uploadLoading || !file}>
                {uploadLoading ? '…' : 'Upload'}
              </button>
            </div>
            {uploadError && <p className="error-text">{uploadError}</p>}
            {uploadSuccess && <p className="text-sm text-green-600">{uploadSuccess}</p>}
          </form>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Business Details</h2>
        <dl className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Owner', value: user.owner_name },
            { label: 'Phone', value: user.phone_number || '-' },
            { label: 'Address', value: user.postal_address || '-' },
            { label: 'Location', value: user.location ? `${user.location.lat.toFixed(4)}, ${user.location.lon.toFixed(4)}` : '-' },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{label}</dt>
              <dd className="text-gray-900 dark:text-white mt-1">{value}</dd>
            </div>
          ))}
        </dl>
        {user.biography && (
          <div className="mt-4">
            <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">About</dt>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{user.biography}</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="section-title mb-0">Quick Links</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/business/jobs" className="btn-secondary">My Jobs</Link>
          <Link to="/business/jobs/new" className="btn-primary">+ Post New Job</Link>
        </div>
      </div>
    </div>
  );
}
