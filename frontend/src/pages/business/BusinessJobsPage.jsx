// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';
import JobStatusBadge from '../../components/JobStatusBadge';
import { PageSpinner } from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

export default function BusinessJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('open,filled');
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statusFilter) {
        params.status = statusFilter.split(',');
      }
      const res = await api.get('/businesses/me/jobs', { params });
      setJobs(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const formatDateTime = (iso) => new Date(iso).toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">My Job Postings</h1>
        {user?.verified ? (
          <Link to="/business/jobs/new" className="btn-primary">+ Post Job</Link>
        ) : (
          <span className="text-sm text-amber-600 dark:text-amber-400">Verification required to post jobs</span>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="open,filled">Active (Open + Filled)</option>
          <option value="open">Open</option>
          <option value="filled">Filled</option>
          <option value="expired">Expired</option>
          <option value="canceled">Canceled</option>
          <option value="completed">Completed</option>
          <option value="open,filled,expired,canceled,completed">All statuses</option>
        </select>
      </div>

      {loading ? (
        <PageSpinner />
      ) : jobs.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">📋</span>
          <p className="text-gray-500 dark:text-gray-400 mt-4">No jobs found.</p>
          {user?.verified && (
            <Link to="/business/jobs/new" className="btn-primary mt-4 inline-flex">Post your first job</Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <Link
              key={job.id}
              to={`/business/jobs/${job.id}`}
              className="card hover:border-primary-300 dark:hover:border-primary-600 transition-colors block"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{job.position_type?.name}</h3>
                    <JobStatusBadge status={job.status} />
                  </div>
                  {job.worker && (
                    <p className="text-sm text-primary-600 dark:text-primary-400">
                      Worker: {job.worker.first_name} {job.worker.last_name}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>💰 ${job.salary_min}-${job.salary_max}/hr</span>
                    <span>📅 {formatDateTime(job.start_time)} → {formatDateTime(job.end_time)}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className="text-primary-600 dark:text-primary-400 text-sm">View →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} total={count} limit={limit} onPageChange={setPage} />
    </div>
  );
}
