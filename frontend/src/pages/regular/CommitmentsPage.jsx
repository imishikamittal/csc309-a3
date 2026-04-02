// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';
import JobStatusBadge from '../../components/JobStatusBadge';
import { PageSpinner } from '../../components/Spinner';

export default function CommitmentsPage() {
  const [jobs, setJobs] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/me/jobs', { params: { page, limit } });
      setJobs(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const formatDateTime = (iso) => new Date(iso).toLocaleString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const now = new Date();
  const activeJobs = jobs.filter(j => j.status === 'filled' && new Date(j.end_time) > now);
  const pastJobs = jobs.filter(j => j.status !== 'filled' || new Date(j.end_time) <= now);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="page-title">Work Commitments</h1>

      {loading ? (
        <PageSpinner />
      ) : jobs.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">📋</span>
          <p className="text-gray-500 dark:text-gray-400 mt-4">No job commitments yet.</p>
          <Link to="/jobs" className="btn-primary mt-4 inline-flex">Browse jobs</Link>
        </div>
      ) : (
        <>
          {activeJobs.length > 0 && (
            <div className="mb-8">
              <h2 className="section-title">Current Commitments</h2>
              <div className="space-y-3">
                {activeJobs.map(job => (
                  <div key={job.id} className="card border-l-4 border-l-primary-500">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{job.position_type?.name}</h3>
                          <JobStatusBadge status={job.status} />
                        </div>
                        <Link to={`/businesses/${job.business?.id}`} className="link text-sm">
                          {job.business?.business_name}
                        </Link>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span>💰 ${job.salary_min}-${job.salary_max}/hr</span>
                          <span>📅 {formatDateTime(job.start_time)}</span>
                          <span>⏰ Ends {formatDateTime(job.end_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="section-title">{activeJobs.length > 0 ? 'Past Jobs' : 'Job History'}</h2>
            {pastJobs.length === 0 ? (
              <p className="text-gray-400 text-sm">No past jobs yet.</p>
            ) : (
              <div className="space-y-3">
                {pastJobs.map(job => (
                  <div key={job.id} className="card opacity-80">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{job.position_type?.name}</h3>
                          <JobStatusBadge status={job.status} />
                        </div>
                        <Link to={`/businesses/${job.business?.id}`} className="link text-sm">
                          {job.business?.business_name}
                        </Link>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span>💰 ${job.salary_min}-${job.salary_max}/hr</span>
                          <span>📅 {formatDateTime(job.start_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Pagination page={page} total={count} limit={limit} onPageChange={setPage} />
    </div>
  );
}
