// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import Pagination from '../../components/Pagination';
import { PageSpinner } from '../../components/Spinner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [suspended, setSuspended] = useState('');
  const [activated, setActivated] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const limit = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.keyword = search;
      if (suspended !== '') params.suspended = suspended === 'true';
      if (activated !== '') params.activated = activated === 'true';
      const res = await api.get('/users', { params });
      setUsers(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, suspended, activated]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(keyword);
    setPage(1);
  };

  const toggleSuspend = async (user) => {
    setActionLoading(user.id);
    try {
      await api.patch(`/users/${user.id}/suspended`, { suspended: !user.suspended });
      fetchUsers();
    } catch {}
    setActionLoading(null);
  };

  return (
    <div>
      <h1 className="page-title">Manage Users</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            className="input flex-1"
            placeholder="Search users…"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <button type="submit" className="btn-primary px-4">Search</button>
        </form>
        <select className="input w-auto" value={suspended} onChange={e => { setSuspended(e.target.value); setPage(1); }}>
          <option value="">All status</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </select>
        <select className="input w-auto" value={activated} onChange={e => { setActivated(e.target.value); setPage(1); }}>
          <option value="">All activation</option>
          <option value="true">Activated</option>
          <option value="false">Not activated</option>
        </select>
      </div>

      {loading ? (
        <PageSpinner />
      ) : users.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No users found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className={u.activated ? 'badge-green' : 'badge-gray'}>{u.activated ? 'Active' : 'Inactive'}</span>
                      {u.suspended && <span className="badge-red">Suspended</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleSuspend(u)}
                      disabled={actionLoading === u.id}
                      className={u.suspended ? 'btn-secondary text-xs px-2 py-1' : 'btn-danger text-xs px-2 py-1'}
                    >
                      {actionLoading === u.id ? '…' : u.suspended ? 'Unsuspend' : 'Suspend'}
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
