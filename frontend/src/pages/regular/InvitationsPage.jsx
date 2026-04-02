// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';
import JobStatusBadge from '../../components/JobStatusBadge';
import { PageSpinner } from '../../components/Spinner';

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const limit = 10;

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/me/invitations', { params: { page, limit } });
      setInvitations(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  const handleAccept = async (jobId) => {
    setAcceptingId(jobId);
    try {
      await api.patch(`/jobs/${jobId}/interested`, { interested: true });
      fetchInvitations();
    } catch {}
    setAcceptingId(null);
  };

  const formatDateTime = (iso) => new Date(iso).toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="page-title">Invitations</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6 -mt-3">
        Businesses have invited you to express interest in these jobs.
      </p>

      {loading ? (
        <PageSpinner />
      ) : invitations.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">📭</span>
          <p className="text-gray-500 dark:text-gray-400 mt-4">No pending invitations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map(job => (
            <div key={job.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{job.position_type?.name}</h3>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <Link to={`/businesses/${job.business?.id}`} className="link text-sm">
                    {job.business?.business_name}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>💰 ${job.salary_min}-${job.salary_max}/hr</span>
                    <span>🕐 {formatDateTime(job.start_time)} → {formatDateTime(job.end_time)}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link to={`/jobs/${job.id}`} className="btn-secondary text-sm px-3 py-1.5">View</Link>
                  {job.status === 'open' && (
                    <button
                      onClick={() => handleAccept(job.id)}
                      disabled={acceptingId === job.id}
                      className="btn-primary text-sm px-3 py-1.5"
                    >
                      {acceptingId === job.id ? '…' : 'Accept'}
                    </button>
                  )}
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
