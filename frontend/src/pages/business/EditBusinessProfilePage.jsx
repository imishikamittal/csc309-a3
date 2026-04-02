// Generated using Claude
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function EditBusinessProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    business_name: user?.business_name || '',
    owner_name: user?.owner_name || '',
    phone_number: user?.phone_number || '',
    postal_address: user?.postal_address || '',
    lat: user?.location?.lat?.toString() || '',
    lon: user?.location?.lon?.toString() || '',
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
      if (form.business_name !== user.business_name) updates.business_name = form.business_name;
      if (form.owner_name !== user.owner_name) updates.owner_name = form.owner_name;
      if (form.phone_number !== user.phone_number) updates.phone_number = form.phone_number;
      if (form.postal_address !== user.postal_address) updates.postal_address = form.postal_address;
      if (form.biography !== user.biography) updates.biography = form.biography;
      const lat = parseFloat(form.lat);
      const lon = parseFloat(form.lon);
      if (!isNaN(lat) && !isNaN(lon) && (lat !== user.location?.lat || lon !== user.location?.lon)) {
        updates.location = { lat, lon };
      }
      if (Object.keys(updates).length > 0) {
        await api.patch('/businesses/me', updates);
        await refreshUser();
      }
      navigate('/business/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Edit Business Profile</h1>
        <button onClick={() => navigate('/business/profile')} className="btn-secondary">Cancel</button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Business name</label>
            <input type="text" className="input" value={form.business_name} onChange={set('business_name')} required />
          </div>
          <div>
            <label className="label">Owner's name</label>
            <input type="text" className="input" value={form.owner_name} onChange={set('owner_name')} required />
          </div>
          <div>
            <label className="label">Phone number</label>
            <input type="tel" className="input" value={form.phone_number} onChange={set('phone_number')} />
          </div>
          <div>
            <label className="label">Postal address</label>
            <input type="text" className="input" value={form.postal_address} onChange={set('postal_address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Latitude</label>
              <input type="number" step="any" className="input" value={form.lat} onChange={set('lat')} />
            </div>
            <div>
              <label className="label">Longitude</label>
              <input type="number" step="any" className="input" value={form.lon} onChange={set('lon')} />
            </div>
          </div>
          <div>
            <label className="label">Biography</label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Tell professionals about your clinic…"
              value={form.biography}
              onChange={set('biography')}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={() => navigate('/business/profile')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
