// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import Pagination from '../../components/Pagination';
import { PageSpinner } from '../../components/Spinner';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const statusBadge = {
  created: 'badge-gray',
  submitted: 'badge-yellow',
  approved: 'badge-green',
  rejected: 'badge-red',
  revised: 'badge-blue',
};

const statusLabel = {
  created: 'Draft',
  submitted: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  revised: 'Revised',
};

export default function QualificationsPage() {
  const [quals, setQuals] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [posTypes, setPosTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPT, setSelectedPT] = useState('');
  const [note, setNote] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const limit = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ptRes, qualRes] = await Promise.all([
        api.get('/position-types', { params: { limit: 100 } }),
        api.get('/users/me/qualifications', { params: { page, limit } }),
      ]);
      setPosTypes(ptRes.data.results || []);
      setQuals(qualRes.data.results || []);
      setCount(qualRes.data.count || 0);
    } catch {
      setQuals([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      await api.post('/qualifications', { position_type_id: parseInt(selectedPT), note });
      setShowCreate(false);
      setSelectedPT('');
      setNote('');
      fetchData();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setCreateError('You already have a qualification for this position type.');
      else setCreateError(err.response?.data?.error || 'Failed to create qualification.');
    } finally {
      setCreateLoading(false);
    }
  };

  const canSubmit = (q) => q.status === 'created';
  const canRevise = (q) => q.status === 'approved' || q.status === 'rejected';

  const handleAction = async (q, newStatus) => {
    setEditError('');
    setEditLoading(true);
    try {
      const data = { status: newStatus };
      if (editNote) data.note = editNote;
      await api.patch(`/qualifications/${q.id}`, data);
      if (editFile) {
        const formData = new FormData();
        formData.append('file', editFile);
        await api.put(`/qualifications/${q.id}/document`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setExpandedId(null);
      setEditNote('');
      setEditFile(null);
      fetchData();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Operation failed.');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">My Qualifications</h1>
        <button onClick={() => setShowCreate(s => !s)} className="btn-primary">
          {showCreate ? 'Cancel' : '+ New Qualification'}
        </button>
      </div>

      {showCreate && (
        <div className="card mb-6">
          <h2 className="section-title">New Qualification Request</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Position type *</label>
              <select className="input" value={selectedPT} onChange={e => setSelectedPT(e.target.value)} required>
                <option value="">Select a position type…</option>
                {posTypes.map(pt => (
                  <option key={pt.id} value={pt.id}>{pt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Note (optional)</label>
              <textarea
                className="input"
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Briefly describe your qualifications…"
              />
            </div>
            {createError && <p className="error-text">{createError}</p>}
            <button type="submit" className="btn-primary" disabled={createLoading}>
              {createLoading ? 'Creating…' : 'Create qualification request'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <PageSpinner />
      ) : quals.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No qualification requests yet.</p>
          <p className="text-sm text-gray-400 mt-1">Create one above to apply for positions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quals.map(q => (
            <div key={q.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{q.position_type?.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Updated: {new Date(q.updatedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  {q.note && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{q.note}</p>
                  )}
                  {q.document && (
                    <a
                      href={`${BASE_URL}${q.document}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm link mt-1 inline-block"
                    >
                      📄 View document
                    </a>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={statusBadge[q.status]}>{statusLabel[q.status]}</span>
                  {(canSubmit(q) || canRevise(q)) && (
                    <button
                      onClick={() => {
                        setExpandedId(expandedId === q.id ? null : q.id);
                        setEditNote(q.note || '');
                        setEditFile(null);
                        setEditError('');
                      }}
                      className="text-xs link"
                    >
                      {expandedId === q.id ? 'Cancel' : canSubmit(q) ? 'Submit for review' : 'Revise & resubmit'}
                    </button>
                  )}
                </div>
              </div>

              {expandedId === q.id && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                  <div>
                    <label className="label">Note</label>
                    <textarea
                      className="input"
                      rows={3}
                      value={editNote}
                      onChange={e => setEditNote(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Supporting document (PDF, optional)</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="input"
                      onChange={e => setEditFile(e.target.files[0])}
                    />
                  </div>
                  {editError && <p className="error-text">{editError}</p>}
                  <button
                    onClick={() => handleAction(q, canSubmit(q) ? 'submitted' : 'revised')}
                    className="btn-primary text-sm"
                    disabled={editLoading}
                  >
                    {editLoading ? '…' : canSubmit(q) ? 'Submit for review' : 'Revise & resubmit'}
                  </button>
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
