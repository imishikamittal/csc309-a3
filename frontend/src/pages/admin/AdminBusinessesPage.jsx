// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import Pagination from '../../components/Pagination';
import { PageSpinner } from '../../components/Spinner';

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [verified, setVerified] = useState('');
  const [activated, setActivated] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const limit = 10;

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.keyword = search;
      if (verified !== '') params.verified = verified === 'true';
      if (activated !== '') params.activated = activated === 'true';
      const res = await api.get('/businesses', { params });
      setBusinesses(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, verified, activated]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(keyword);
    setPage(1);
  };

  const toggleVerify = async (business) => {
    setActionLoading(business.id);
    try {
      await api.patch(`/businesses/${business.id}/verified`, { verified: !business.verified });
      fetchBusinesses();
    } catch {}
    setActionLoading(null);
  };

  return (
    <div>
      <h1 className="page-title">Manage Businesses</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            className="input flex-1"
            placeholder="Search businesses…"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <button type="submit" className="btn-primary px-4">Search</button>
        </form>
        <select className="input w-auto" value={verified} onChange={e => { setVerified(e.target.value); setPage(1); }}>
          <option value="">All verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
        <select className="input w-auto" value={activated} onChange={e => { setActivated(e.target.value); setPage(1); }}>
          <option value="">All activation</option>
          <option value="true">Activated</option>
          <option value="false">Not activated</option>
        </select>
      </div>

      {loading ? (
        <PageSpinner />
      ) : businesses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No businesses found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Business</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Owner</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {businesses.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{b.business_name}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">{b.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{b.owner_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className={b.activated ? 'badge-green' : 'badge-gray'}>{b.activated ? 'Active' : 'Inactive'}</span>
                      <span className={b.verified ? 'badge-teal' : 'badge-yellow'}>{b.verified ? 'Verified' : 'Unverified'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleVerify(b)}
                      disabled={actionLoading === b.id}
                      className={b.verified ? 'btn-secondary text-xs px-2 py-1' : 'btn-primary text-xs px-2 py-1'}
                    >
                      {actionLoading === b.id ? '…' : b.verified ? 'Unverify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} total={count} limit={limit} onPageChange={setPage} />
    </div>
  );
}
