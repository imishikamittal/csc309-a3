// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';
import Avatar from '../../components/Avatar';
import { PageSpinner } from '../../components/Spinner';

export default function JobInterestsPage() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const [interests, setInterests] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const limit = 10;

  const fetchInterests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${jobId}/interests`, { params: { page, limit } });
      setInterests(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setInterests([]);
    } finally {
      setLoading(false);
    }
  }, [jobId, page]);

  useEffect(() => { fetchInterests(); }, [fetchInterests]);

  const handleNegotiate = async (item) => {
    setError('');
    setActionLoading(item.interest_id);
    try {
      await api.post('/negotiations', { interest_id: item.interest_id });
      navigate('/business/negotiation');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        const estWait = err.response?.data?.estimatedWait;
        setError(`Cannot start negotiation. ${estWait ? `Est. wait: ${Math.ceil(estWait / 60)} min.` : 'Try again later.'}`);
      } else if (status === 403) {
        setError(err.response?.data?.error || 'Cannot start negotiation - the candidate may no longer be discoverable for this job.');
      } else {
        setError('Failed to start negotiation.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/business/jobs/${jobId}`} className="text-sm link">← Back to job</Link>
        <h1 className="page-title mb-0">Interested Candidates</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-6 -mt-2">
        Professionals who expressed interest in this job.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <PageSpinner />
      ) : interests.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">💤</span>
          <p className="text-gray-500 dark:text-gray-400 mt-4">No one has expressed interest yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interests.map(item => (
            <div key={item.interest_id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar name={`${item.user?.first_name} ${item.user?.last_name}`} size="md" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.user?.first_name} {item.user?.last_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {item.mutual ? (
                      <span className="badge-teal">✓ Mutual match</span>
                    ) : (
                      <span className="badge-gray">One-sided interest</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  to={`/business/jobs/${jobId}/candidates/${item.user?.id}`}
                  className="btn-secondary text-sm px-3 py-1.5"
                >
                  View
                </Link>
                {item.mutual && (
                  <button
                    onClick={() => handleNegotiate(item)}
                    disabled={actionLoading === item.interest_id}
                    className="btn-primary text-sm px-3 py-1.5"
                  >
                    {actionLoading === item.interest_id ? '…' : '🤝 Negotiate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={count} limit={limit} onPageChange={setPage} />
    </div>
  );
}
