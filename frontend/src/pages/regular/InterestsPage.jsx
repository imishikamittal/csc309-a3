// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';
import JobStatusBadge from '../../components/JobStatusBadge';
import { PageSpinner } from '../../components/Spinner';

export default function InterestsPage() {
  const [interests, setInterests] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const limit = 10;

  const fetchInterests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/me/interests', { params: { page, limit } });
      setInterests(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setInterests([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchInterests(); }, [fetchInterests]);

  const handleNegotiate = async (item) => {
    setError('');
    setActionLoading(item.interest_id);
    try {
      await api.post('/negotiations', { interest_id: item.interest_id });
      navigate('/negotiation');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        const estWait = err.response?.data?.estimatedWait;
        setError(`Cannot start negotiation. ${estWait ? `Estimated wait: ${Math.ceil(estWait / 60)} min.` : 'Try again later.'}`);
      } else if (status === 403) {
        setError(err.response?.data?.error || 'Cannot start negotiation - you may not be discoverable for this job (check availability, qualifications, or conflicting commitments).');
      } else {
        setError('Failed to start negotiation.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async (jobId) => {
    setActionLoading(jobId);
    try {
      await api.patch(`/jobs/${jobId}/interested`, { interested: false });
      fetchInterests();
    } catch {}
    setActionLoading(null);
  };

  const formatDateTime = (iso) => new Date(iso).toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="page-title">My Interests</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6 -mt-3">
        Jobs you've expressed interest in. When mutual interest is reached, you can negotiate.
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
          <span className="text-4xl">🔍</span>
          <p className="text-gray-500 dark:text-gray-400 mt-4">No active interests.</p>
          <Link to="/jobs" className="btn-primary mt-4 inline-flex">Browse jobs</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {interests.map(item => (
            <div key={item.interest_id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.job?.position_type?.name}</h3>
                    <JobStatusBadge status={item.job?.status} />
                    {item.mutual && (
                      <span className="badge-teal">✓ Mutual</span>
                    )}
                  </div>
                  <Link to={`/businesses/${item.job?.business?.id}`} className="link text-sm">
                    {item.job?.business?.business_name}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>💰 ${item.job?.salary_min}-${item.job?.salary_max}/hr</span>
                    <span>🕐 {formatDateTime(item.job?.start_time)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0 items-end">
                  {item.mutual && item.job?.status === 'open' && (
                    <button
                      onClick={() => handleNegotiate(item)}
                      disabled={actionLoading === item.interest_id}
                      className="btn-primary text-sm px-3 py-1.5"
                    >
                      {actionLoading === item.interest_id ? '…' : '🤝 Negotiate'}
                    </button>
                  )}
                  <button
                    onClick={() => handleWithdraw(item.job?.id)}
                    disabled={actionLoading === item.job?.id}
                    className="btn-secondary text-sm px-3 py-1.5"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={count} limit={limit} onPageChange={setPage} />
    </div>
  );
}
