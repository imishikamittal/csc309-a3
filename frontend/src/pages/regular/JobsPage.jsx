// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';
import JobStatusBadge from '../../components/JobStatusBadge';
import { PageSpinner } from '../../components/Spinner';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [posTypes, setPosTypes] = useState([]);
  const [filters, setFilters] = useState({
    position_type_id: '',
    sort: 'start_time',
    order: 'asc',
    lat: '',
    lon: '',
  });
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const fetchPosTypes = useCallback(async () => {
    try {
      const res = await api.get('/position-types', { params: { limit: 100 } });
      setPosTypes(res.data.results || []);
    } catch {}
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, sort: filters.sort, order: filters.order };
      if (filters.position_type_id) params.position_type_id = filters.position_type_id;
      if (filters.lat && filters.lon) {
        params.lat = parseFloat(filters.lat);
        params.lon = parseFloat(filters.lon);
      }
      const res = await api.get('/jobs', { params });
      setJobs(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchPosTypes(); }, [fetchPosTypes]);
  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const set = (k) => (e) => {
    setFilters(f => ({ ...f, [k]: e.target.value }));
    setPage(1);
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <h1 className="page-title">Browse Jobs</h1>

      <div className="card mb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Position type</label>
            <select className="input" value={filters.position_type_id} onChange={set('position_type_id')}>
              <option value="">All positions</option>
              {posTypes.map(pt => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Sort by</label>
            <select className="input" value={filters.sort} onChange={set('sort')}>
              <option value="start_time">Start time</option>
              <option value="salary_min">Min salary</option>
              <option value="salary_max">Max salary</option>
              <option value="updatedAt">Posted date</option>
              {filters.lat && filters.lon && <>
                <option value="distance">Distance</option>
                <option value="eta">ETA</option>
              </>}
            </select>
          </div>
          <div>
            <label className="label">Order</label>
            <select className="input" value={filters.order} onChange={set('order')}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Your Lat</label>
              <input type="number" step="any" className="input" placeholder="43.65" value={filters.lat} onChange={set('lat')} />
            </div>
            <div>
              <label className="label">Your Lon</label>
              <input type="number" step="any" className="input" placeholder="-79.38" value={filters.lon} onChange={set('lon')} />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : jobs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No jobs available for your qualifications.</p>
          <p className="text-sm text-gray-400 mt-1">Make sure you have approved qualifications and your availability is set.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="card hover:border-primary-300 dark:hover:border-primary-600 transition-colors block"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{job.position_type?.name}</h3>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <p className="text-primary-600 dark:text-primary-400 font-medium">{job.business?.business_name}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>💰 ${job.salary_min}-${job.salary_max}/hr</span>
                    <span>🕐 {formatDateTime(job.start_time)} → {formatDateTime(job.end_time)}</span>
                    {job.distance != null && <span>📍 {job.distance.toFixed(1)} km</span>}
                    {job.eta != null && <span>🚗 {Math.round(job.eta)} min</span>}
                  </div>
                </div>
                <span className="text-primary-600 dark:text-primary-400 text-sm shrink-0">View →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} total={count} limit={limit} onPageChange={setPage} />
    </div>
  );
}
