// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';
import Avatar from '../../components/Avatar';
import { PageSpinner } from '../../components/Spinner';

export default function CandidatesPage() {
  const { id: jobId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(null);
  const [error, setError] = useState('');
  const limit = 10;

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${jobId}/candidates`, { params: { page, limit } });
      setCandidates(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [jobId, page]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const handleInvite = async (userId, currently_invited) => {
    setError('');
    setInviteLoading(userId);
    try {
      await api.patch(`/jobs/${jobId}/candidates/${userId}/interested`, { interested: !currently_invited });
      fetchCandidates();
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) setError('Nothing to withdraw - user has not been invited.');
      else if (status === 403) setError('Candidate is no longer discoverable.');
      else if (status === 409) setError('Job is not in a state that allows invitations.');
      else setError('Action failed.');
    } finally {
      setInviteLoading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/business/jobs/${jobId}`} className="text-sm link">← Back to job</Link>
        <h1 className="page-title mb-0">Available Candidates</h1>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-6 -mt-2">
        These professionals are available and qualified for this job.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <PageSpinner />
      ) : candidates.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">🔍</span>
          <p className="text-gray-500 dark:text-gray-400 mt-4">No available candidates right now.</p>
          <p className="text-sm text-gray-400 mt-1">Candidates must be available, qualified, and active.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map(c => (
            <div key={c.id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar name={`${c.first_name} ${c.last_name}`} size="md" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {c.first_name} {c.last_name}
                  </h3>
                  {c.invited && <span className="badge-teal text-xs">Invited</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  to={`/business/jobs/${jobId}/candidates/${c.id}`}
                  className="btn-secondary text-sm px-3 py-1.5"
                >
                  View Profile
                </Link>
                <button
                  onClick={() => handleInvite(c.id, c.invited)}
                  disabled={inviteLoading === c.id}
                  className={c.invited ? 'btn-secondary text-sm px-3 py-1.5' : 'btn-primary text-sm px-3 py-1.5'}
                >
                  {inviteLoading === c.id ? '…' : c.invited ? 'Withdraw' : 'Invite'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={count} limit={limit} onPageChange={setPage} />
    </div>
  );
}
