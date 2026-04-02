// Generated using Claude
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function CreateJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    position_type_id: '',
    salary_min: '',
    salary_max: '',
    start_time: '',
    end_time: '',
    note: '',
  });
  const [posTypes, setPosTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/position-types', { params: { limit: 100 } })
      .then(res => setPosTypes(res.data.results || []))
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const salMin = parseFloat(form.salary_min);
    const salMax = parseFloat(form.salary_max);
    if (isNaN(salMin) || salMin < 0) { setError('Minimum salary must be >= 0.'); return; }
    if (isNaN(salMax) || salMax < salMin) { setError('Maximum salary must be >= minimum salary.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/businesses/me/jobs', {
        position_type_id: parseInt(form.position_type_id),
        salary_min: salMin,
        salary_max: salMax,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        note: form.note || undefined,
      });
      navigate(`/business/jobs/${res.data.id}`);
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) setError('Invalid input. Check timing constraints - start must be in the future, end must be after start, and there must be enough time for a full negotiation window.');
      else if (status === 403) setError('Your business must be verified to post jobs.');
      else setError('Failed to create job.');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const nowStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Post a Job</h1>
        <button onClick={() => navigate('/business/jobs')} className="btn-secondary">Cancel</button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Position type *</label>
            <select className="input" value={form.position_type_id} onChange={set('position_type_id')} required>
              <option value="">Select a position type…</option>
              {posTypes.map(pt => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min salary ($/hr) *</label>
              <input type="number" step="0.01" min="0" className="input" placeholder="28.00" value={form.salary_min} onChange={set('salary_min')} required />
            </div>
            <div>
              <label className="label">Max salary ($/hr) *</label>
              <input type="number" step="0.01" min="0" className="input" placeholder="35.00" value={form.salary_max} onChange={set('salary_max')} required />
            </div>
          </div>
          <div>
            <label className="label">Start time *</label>
            <input type="datetime-local" className="input" min={nowStr} value={form.start_time} onChange={set('start_time')} required />
          </div>
          <div>
            <label className="label">End time *</label>
            <input type="datetime-local" className="input" min={form.start_time || nowStr} value={form.end_time} onChange={set('end_time')} required />
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Any additional notes about this position…"
              value={form.note}
              onChange={set('note')}
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> The job start time must be within the job start window (default 1 week from now), and there must be enough time before the start for a full negotiation window.
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Posting…' : 'Post job'}
            </button>
            <button type="button" onClick={() => navigate('/business/jobs')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
