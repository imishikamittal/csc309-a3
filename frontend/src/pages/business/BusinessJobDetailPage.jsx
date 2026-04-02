// Generated using Claude
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import JobStatusBadge from '../../components/JobStatusBadge';
import { PageSpinner } from '../../components/Spinner';

export default function BusinessJobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [noShowLoading, setNoShowLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const loadJob = async () => {
    try {
      const res = await api.get('/businesses/me/jobs', { params: { status: ['open', 'filled', 'expired', 'canceled', 'completed'], limit: 100 } });
      const found = res.data.results?.find(j => j.id === parseInt(id));
      if (found) {
        setJob(found);
        setForm({
          salary_min: found.salary_min,
          salary_max: found.salary_max,
          start_time: new Date(found.start_time).toISOString().slice(0, 16),
          end_time: new Date(found.end_time).toISOString().slice(0, 16),
          note: found.note || '',
        });
      }
    } catch {}
  };

  useEffect(() => {
    loadJob().finally(() => setLoading(false));
  }, [id]);

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    setEditLoading(true);
    try {
      await api.patch(`/businesses/me/jobs/${id}`, {
        salary_min: parseFloat(form.salary_min),
        salary_max: parseFloat(form.salary_max),
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        note: form.note,
      });
      setEditing(false);
      setMsg('Job updated!');
      await loadJob();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError('Job cannot be edited - it may no longer be open.');
      else if (status === 400) setError('Invalid input. Check timing constraints.');
      else setError('Update failed.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this job posting?')) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/businesses/me/jobs/${id}`);
      navigate('/business/jobs');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError('Cannot delete - job may be filled or in active negotiation.');
      else setError('Delete failed.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleNoShow = async () => {
    if (!window.confirm('Report this worker as a no-show? This will cancel the job and suspend the worker.')) return;
    setNoShowLoading(true);
    try {
      await api.patch(`/jobs/${id}/no-show`);
      setMsg('No-show reported. Worker suspended.');
      await loadJob();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError('Cannot report no-show - job must be in progress (between start and end time).');
      else setError('No-show report failed.');
    } finally {
      setNoShowLoading(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (!job && error) return (
    <div className="card text-center py-12 max-w-xl mx-auto">
      <p className="text-red-500">{error}</p>
      <button onClick={() => navigate('/business/jobs')} className="btn-secondary mt-4">Back to jobs</button>
    </div>
  );

  const now = new Date();
  const isOpen = job?.status === 'open';
  const isFilled = job?.status === 'filled';
  const canDelete = isOpen || job?.status === 'expired';
  const canEdit = isOpen;
  const canNoShow = isFilled && now >= new Date(job.start_time) && now < new Date(job.end_time);

  const formatDT = (iso) => new Date(iso).toLocaleString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/business/jobs')} className="text-sm link mb-4 inline-flex items-center gap-1">
        ← Back to jobs
      </button>

      <div className="card mt-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{job?.position_type?.name}</h1>
            {job?.worker && (
              <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                Worker: {job.worker.first_name} {job.worker.last_name}
              </p>
            )}
          </div>
          <JobStatusBadge status={job?.status} />
        </div>

        {!editing ? (
          <dl className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Salary</dt>
              <dd className="text-gray-900 dark:text-white mt-1 font-semibold">${job?.salary_min}-${job?.salary_max}/hr</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Start</dt>
              <dd className="text-gray-900 dark:text-white mt-1">{formatDT(job?.start_time)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">End</dt>
              <dd className="text-gray-900 dark:text-white mt-1">{formatDT(job?.end_time)}</dd>
            </div>
            {job?.note && (
              <div className="col-span-2">
                <dt className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Notes</dt>
                <dd className="text-gray-900 dark:text-white mt-1">{job.note}</dd>
              </div>
            )}
          </dl>
        ) : (
          <form onSubmit={handleEdit} className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Min salary</label>
                <input type="number" step="0.01" min="0" className="input" value={form.salary_min} onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))} />
              </div>
              <div>
                <label className="label">Max salary</label>
                <input type="number" step="0.01" min="0" className="input" value={form.salary_max} onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Start time</label>
              <input type="datetime-local" className="input" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div>
              <label className="label">End time</label>
              <input type="datetime-local" className="input" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input" rows={3} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            {error && <p className="error-text">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" className="btn-primary text-sm" disabled={editLoading}>
                {editLoading ? '…' : 'Save changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        )}

        {msg && <p className="text-sm text-green-600 dark:text-green-400 mb-3">{msg}</p>}
        {error && !editing && <p className="error-text mb-3">{error}</p>}

        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          {canEdit && (
            <button onClick={() => setEditing(e => !e)} className="btn-secondary text-sm">
              {editing ? 'Cancel edit' : '✏️ Edit job'}
            </button>
          )}
          <Link to={`/business/jobs/${id}/candidates`} className="btn-secondary text-sm">
            👥 Candidates
          </Link>
          <Link to={`/business/jobs/${id}/interests`} className="btn-secondary text-sm">
            ❤️ Interested
          </Link>
          {canNoShow && (
            <button onClick={handleNoShow} className="btn-danger text-sm" disabled={noShowLoading}>
              {noShowLoading ? '…' : '🚫 Report No-Show'}
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete} className="btn-danger text-sm" disabled={deleteLoading}>
              {deleteLoading ? '…' : '🗑️ Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
