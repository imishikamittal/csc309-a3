// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import Pagination from '../../components/Pagination';
import { PageSpinner } from '../../components/Spinner';

export default function AdminPositionTypesPage() {
  const [positions, setPositions] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [hiddenFilter, setHiddenFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', hidden: false });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState('');
  const limit = 10;

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.keyword = search;
      if (hiddenFilter !== '') params.hidden = hiddenFilter === 'true';
      const res = await api.get('/position-types', { params });
      setPositions(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setPositions([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, hiddenFilter]);

  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      await api.post('/position-types', {
        name: createForm.name,
        description: createForm.description,
        hidden: createForm.hidden,
      });
      setShowCreate(false);
      setCreateForm({ name: '', description: '', hidden: false });
      fetchPositions();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create position type.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      await api.patch(`/position-types/${editId}`, editForm);
      setEditId(null);
      setEditForm({});
      fetchPositions();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Failed to update.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this position type? This cannot be undone.')) return;
    setActionError('');
    setActionLoading(id);
    try {
      await api.delete(`/position-types/${id}`);
      fetchPositions();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setActionError('Cannot delete - there are qualified users for this position type.');
      else setActionError('Delete failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleHidden = async (pt) => {
    setActionLoading(pt.id);
    try {
      await api.patch(`/position-types/${pt.id}`, { hidden: !pt.hidden });
      fetchPositions();
    } catch {}
    setActionLoading(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Position Types</h1>
        <button onClick={() => setShowCreate(s => !s)} className="btn-primary">
          {showCreate ? 'Cancel' : '+ Add Position'}
        </button>
      </div>

      {showCreate && (
        <div className="card mb-6">
          <h2 className="section-title">New Position Type</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Name *</label>
              <input type="text" className="input" placeholder="e.g., Dental Hygienist" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea className="input" rows={2} value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} required />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="hidden" checked={createForm.hidden} onChange={e => setCreateForm(f => ({ ...f, hidden: e.target.checked }))} />
              <label htmlFor="hidden" className="text-sm text-gray-700 dark:text-gray-300">Hidden (not visible to users)</label>
            </div>
            {createError && <p className="error-text">{createError}</p>}
            <button type="submit" className="btn-primary" disabled={createLoading}>
              {createLoading ? 'Creating…' : 'Create position type'}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); setSearch(keyword); setPage(1); }} className="flex gap-2 flex-1 min-w-[200px]">
          <input type="text" className="input flex-1" placeholder="Search positions…" value={keyword} onChange={e => setKeyword(e.target.value)} />
          <button type="submit" className="btn-primary px-4">Search</button>
        </form>
        <select className="input w-auto" value={hiddenFilter} onChange={e => { setHiddenFilter(e.target.value); setPage(1); }}>
          <option value="">All visibility</option>
          <option value="false">Visible</option>
          <option value="true">Hidden</option>
        </select>
      </div>

      {actionError && <p className="error-text mb-4">{actionError}</p>}

      {loading ? (
        <PageSpinner />
      ) : positions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No position types found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.map(pt => (
            <div key={pt.id} className="card">
              {editId === pt.id ? (
                <form onSubmit={handleEdit} className="space-y-3">
                  <div>
                    <label className="label">Name</label>
                    <input type="text" className="input" value={editForm.name ?? pt.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea className="input" rows={2} value={editForm.description ?? pt.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={editForm.hidden ?? pt.hidden} onChange={e => setEditForm(f => ({ ...f, hidden: e.target.checked }))} />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Hidden</label>
                  </div>
                  {editError && <p className="error-text">{editError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm" disabled={editLoading}>{editLoading ? '…' : 'Save'}</button>
                    <button type="button" onClick={() => { setEditId(null); setEditForm({}); }} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{pt.name}</h3>
                      <span className={pt.hidden ? 'badge-gray' : 'badge-green'}>{pt.hidden ? 'Hidden' : 'Visible'}</span>
                      {pt.num_qualified !== undefined && (
                        <span className="badge-blue">{pt.num_qualified} qualified</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pt.description}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setEditId(pt.id); setEditForm({}); }} className="btn-secondary text-xs px-2 py-1">Edit</button>
                    <button onClick={() => toggleHidden(pt)} disabled={actionLoading === pt.id} className="btn-secondary text-xs px-2 py-1">
                      {actionLoading === pt.id ? '…' : pt.hidden ? 'Show' : 'Hide'}
                    </button>
                    <button onClick={() => handleDelete(pt.id)} disabled={actionLoading === pt.id} className="btn-danger text-xs px-2 py-1">
                      {actionLoading === pt.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} total={count} limit={limit} onPageChange={setPage} />
    </div>
  );
}
