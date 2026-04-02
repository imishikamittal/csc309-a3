// Generated using Claude
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import Avatar from '../../components/Avatar';
import { PageSpinner } from '../../components/Spinner';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AdminQualificationReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qual, setQual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/qualifications/${id}`)
      .then(res => setQual(res.data))
      .catch(() => setError('Qualification not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDecision = async (status) => {
    setActionError('');
    setActionLoading(true);
    try {
      await api.patch(`/qualifications/${id}`, { status });
      setMsg(`Qualification ${status}!`);
      const res = await api.get(`/qualifications/${id}`);
      setQual(res.data);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (error) return (
    <div className="card text-center py-12 max-w-xl mx-auto">
      <p className="text-red-500">{error}</p>
      <Link to="/admin/qualifications" className="btn-secondary mt-4 inline-flex">Back to reviews</Link>
    </div>
  );

  const statusBadge = { submitted: 'badge-yellow', revised: 'badge-blue', approved: 'badge-green', rejected: 'badge-red', created: 'badge-gray' };
  const canReview = qual?.status === 'submitted' || qual?.status === 'revised';

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/admin/qualifications" className="text-sm link mb-4 inline-flex items-center gap-1">
        ← Back to reviews
      </Link>

      <div className="card mt-4 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{qual?.position_type?.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {qual?.position_type?.description}
            </p>
          </div>
          <span className={statusBadge[qual?.status] || 'badge-gray'}>{qual?.status}</span>
        </div>
        <p className="text-xs text-gray-400">
          Updated: {new Date(qual?.updatedAt).toLocaleString()}
        </p>
      </div>

      <div className="card mb-4">
        <h2 className="section-title">Applicant</h2>
        <div className="flex items-start gap-4">
          <Avatar src={qual?.user?.avatar} name={`${qual?.user?.first_name} ${qual?.user?.last_name}`} size="lg" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {qual?.user?.first_name} {qual?.user?.last_name}
            </p>
            {qual?.user?.email && <p className="text-sm text-gray-500 dark:text-gray-400">{qual.user.email}</p>}
            {qual?.user?.phone_number && <p className="text-sm text-gray-500 dark:text-gray-400">{qual.user.phone_number}</p>}
            {qual?.user?.biography && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{qual.user.biography}</p>
            )}
          </div>
        </div>
        {qual?.user?.resume && (
          <div className="mt-3">
            <a
              href={`${BASE_URL}${qual.user.resume}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              📄 View Resume
            </a>
          </div>
        )}
      </div>

      <div className="card mb-4">
        <h2 className="section-title">Qualification Details</h2>
        {qual?.note ? (
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{qual.note}</p>
        ) : (
          <p className="text-gray-400 text-sm italic">No notes provided.</p>
        )}
        {qual?.document && (
          <div className="mt-3">
            <a
              href={`${BASE_URL}${qual.document}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              📄 View Supporting Document
            </a>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="section-title">Decision</h2>

        {msg && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-4">
            <p className="text-green-700 dark:text-green-400 text-sm">{msg}</p>
          </div>
        )}
        {actionError && <p className="error-text mb-3">{actionError}</p>}

        {canReview ? (
          <div className="flex gap-3">
            <button
              onClick={() => handleDecision('approved')}
              disabled={actionLoading}
              className="btn-primary"
            >
              {actionLoading ? '…' : '✓ Approve'}
            </button>
            <button
              onClick={() => handleDecision('rejected')}
              disabled={actionLoading}
              className="btn-danger"
            >
              {actionLoading ? '…' : '✗ Reject'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {qual?.status === 'approved' ? 'This qualification has been approved.' :
             qual?.status === 'rejected' ? 'This qualification has been rejected.' :
             'This qualification is not ready for review yet.'}
          </p>
        )}
      </div>
    </div>
  );
}
