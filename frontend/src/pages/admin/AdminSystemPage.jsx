// Generated using Claude
import { useState } from 'react';
import api from '../../api';

function ConfigCard({ title, description, field, unit, endpoint, defaultVal }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const num = parseFloat(value);
    if (isNaN(num)) { setError('Please enter a valid number.'); return; }
    setLoading(true);
    try {
      const res = await api.patch(endpoint, { [field]: num });
      setSuccess(`Updated to ${res.data[field]} ${unit}.`);
      setValue('');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</p>
      <p className="text-xs text-gray-400 mb-3">Default: {defaultVal} {unit}</p>
      <form onSubmit={handleSubmit} className="flex gap-2 items-start">
        <div className="flex-1">
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              min="0"
              className="input"
              placeholder={`New value (${unit})`}
              value={value}
              onChange={e => setValue(e.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0" disabled={loading}>
              {loading ? '…' : 'Update'}
            </button>
          </div>
          {success && <p className="text-sm text-green-600 dark:text-green-400 mt-1">{success}</p>}
          {error && <p className="error-text mt-1">{error}</p>}
        </div>
      </form>
    </div>
  );
}

export default function AdminSystemPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="page-title">System Configuration</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6 -mt-3">
        Changes apply immediately but are not persisted across server restarts.
      </p>

      <div className="space-y-4">
        <ConfigCard
          title="Reset Cooldown"
          description="Minimum time between password reset requests from the same IP address."
          field="reset_cooldown"
          unit="seconds"
          endpoint="/system/reset-cooldown"
          defaultVal="60"
        />
        <ConfigCard
          title="Negotiation Window"
          description="Duration of each negotiation session."
          field="negotiation_window"
          unit="seconds"
          endpoint="/system/negotiation-window"
          defaultVal="900 (15 min)"
        />
        <ConfigCard
          title="Job Start Window"
          description="How far in advance a new job start time can be scheduled."
          field="job_start_window"
          unit="hours"
          endpoint="/system/job-start-window"
          defaultVal="168 (1 week)"
        />
        <ConfigCard
          title="Availability Timeout"
          description="How long a user can be inactive before being considered unavailable."
          field="availability_timeout"
          unit="seconds"
          endpoint="/system/availability-timeout"
          defaultVal="300 (5 min)"
        />
      </div>
    </div>
  );
}
