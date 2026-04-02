// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';
import { PageSpinner } from '../../components/Spinner';

export default function AdminQualificationsPage() {
  const [quals, setQuals] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const fetchQuals = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.keyword = search;
      const res = await api.get('/qualifications', { params });
      setQuals(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setQuals([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchQuals(); }, [fetchQuals]);

  const statusBadge = { submitted: 'badge-yellow', revised: 'badge-blue' };

  return (
    <div>
      <h1 className="page-title">Qualification Reviews</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6 -mt-3">
        These qualifications have been submitted or revised and need your review.
      </p>

      <div className="flex gap-2 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(keyword); setPage(1); }} className="flex gap-2 flex-1">
          <input type="text" className="input flex-1" placeholder="Search by name, email…" value={keyword} onChange={e => setKeyword(e.target.value)} />
          <button type="submit" className="btn-primary px-4">Search</button>
        </form>
      </div>

      {loading ? (
        <PageSpinner />
      ) : quals.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">✅</span>
          <p className="text-gray-500 dark:text-gray-400 mt-4">No pending reviews. All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quals.map(q => (
            <div key={q.id} className="card flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {q.user?.first_name} {q.user?.last_name}
                  </h3>
                  <span className={statusBadge[q.status] || 'badge-gray'}>{q.status}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{q.position_type?.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Updated: {new Date(q.updatedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <Link
                to={`/admin/qualifications/${q.id}`}
                className="btn-primary text-sm px-3 py-1.5 shrink-0"
              >
                Review
              </Link>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={count} limit={limit} onPageChange={setPage} />
    </div>
  );
}
