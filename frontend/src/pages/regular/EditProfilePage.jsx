// Generated using Claude
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    postal_address: user?.postal_address || '',
    birthday: user?.birthday || '',
    biography: user?.biography || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const updates = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== (user[k] || '')) updates[k] = v;
      });
      if (Object.keys(updates).length === 0) {
        navigate('/profile');
        return;
      }
      await api.patch('/users/me', updates);
      await refreshUser();
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Edit Profile</h1>
        <button onClick={() => navigate('/profile')} className="btn-secondary">Cancel</button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First name</label>
              <input type="text" className="input" value={form.first_name} onChange={set('first_name')} required />
            </div>
            <div>
              <label className="label">Last name</label>
              <input type="text" className="input" value={form.last_name} onChange={set('last_name')} required />
            </div>
          </div>
          <div>
            <label className="label">Phone number</label>
            <input type="tel" className="input" value={form.phone_number} onChange={set('phone_number')} />
          </div>
          <div>
            <label className="label">Postal address</label>
            <input type="text" className="input" value={form.postal_address} onChange={set('postal_address')} />
          </div>
          <div>
            <label className="label">Birthday</label>
            <input type="date" className="input" value={form.birthday} onChange={set('birthday')} />
          </div>
          <div>
            <label className="label">Biography</label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Tell clinics about yourself…"
              value={form.biography}
              onChange={set('biography')}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={() => navigate('/profile')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
