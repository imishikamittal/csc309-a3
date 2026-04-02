// Generated using Claude
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import JobStatusBadge from '../../components/JobStatusBadge';
import { PageSpinner } from '../../components/Spinner';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [interest, setInterest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data);
        const interestsRes = await api.get('/users/me/interests');
        const found = interestsRes.data.results?.find(i => i.job?.id === parseInt(id));
        setInterest(found || null);
      } catch (err) {
        if (err.response?.status === 403) setError('You are not qualified for this job.');
        else if (err.response?.status === 404) setError('Job not found.');
        else setError('Failed to load job.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleInterest = async (interested) => {
    setError('');
    setMsg('');
    setActionLoading(true);
    try {
      const res = await api.patch(`/jobs/${id}/interested`, { interested });
      setInterest(interested ? { interest_id: res.data.id, mutual: res.data.candidate?.interested && res.data.business?.interested } : null);
      setMsg(interested ? 'Interest expressed!' : 'Interest withdrawn.');
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) setMsg('No interest to withdraw.');
      else if (status === 409) setError('Job is no longer available or you are in a negotiation for this job.');
      else if (status === 403) setError('You are not qualified for this job.');
      else setError('Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNegotiate = async () => {
    if (!interest) return;
    setActionLoading(true);
    setError('');
    try {
      await api.post('/negotiations', { interest_id: interest.interest_id });
      navigate('/negotiation');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError(err.response?.data?.error || 'Cannot start negotiation right now.');
      else if (status === 403) setError('Mutual interest is required to start negotiation.');
      else setError('Failed to start negotiation.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (error && !job) return (
    <div className="card text-center py-12 max-w-xl mx-auto">
      <p className="text-red-500">{error}</p>
      <button onClick={() => navigate('/jobs')} className="btn-secondary mt-4">Back to jobs</button>
    </div>
  );

  const formatDateTime = (iso) => new Date(iso).toLocaleString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/jobs')} className="text-sm link mb-4 inline-flex items-center gap-1">
        ← Back to jobs
      </button>

      <div className="card mt-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{job.position_type?.name}</h1>
            <Link to={`/businesses/${job.business?.id}`} className="link mt-1 inline-block">
              {job.business?.business_name}
            </Link>
          </div>
          <JobStatusBadge status={job.status} />
        </div>

        <dl className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Salary</dt>
            <dd className="text-gray-900 dark:text-white mt-1 font-semibold">${job.salary_min}-${job.salary_max}/hr</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Start</dt>
            <dd className="text-gray-900 dark:text-white mt-1">{formatDateTime(job.start_time)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">End</dt>
            <dd className="text-gray-900 dark:text-white mt-1">{formatDateTime(job.end_time)}</dd>
          </div>
          {job.distance != null && (
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Distance / ETA</dt>
              <dd className="text-gray-900 dark:text-white mt-1">{job.distance.toFixed(1)} km · {Math.round(job.eta)} min</dd>
            </div>
          )}
        </dl>

        {job.note && (
          <div className="mb-6">
            <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Notes</dt>
            <p className="text-gray-700 dark:text-gray-300">{job.note}</p>
          </div>
        )}

        {error && <p className="error-text mb-3">{error}</p>}
        {msg && <p className="text-sm text-green-600 dark:text-green-400 mb-3">{msg}</p>}

        {job.status === 'open' && (
          <div className="flex flex-wrap gap-3">
            {!interest ? (
              <button
                onClick={() => handleInterest(true)}
                className="btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? '…' : '👋 Express Interest'}
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="badge-green">Interested</span>
                  {interest.mutual && <span className="badge-teal">✓ Mutual match!</span>}
                </div>
                {interest.mutual && (
                  <button
                    onClick={handleNegotiate}
                    className="btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? '…' : '🤝 Start Negotiation'}
                  </button>
                )}
                <button
                  onClick={() => handleInterest(false)}
                  className="btn-secondary"
                  disabled={actionLoading}
                >
                  Withdraw Interest
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
