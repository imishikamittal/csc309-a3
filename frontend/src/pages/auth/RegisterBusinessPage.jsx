// Generated using Claude
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';

export default function RegisterBusinessPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    business_name: '', owner_name: '', email: '', password: '',
    phone_number: '', postal_address: '',
    lat: '', lon: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const lat = parseFloat(form.lat);
    const lon = parseFloat(form.lon);
    if (isNaN(lat) || isNaN(lon)) {
      setError('Please enter valid latitude and longitude coordinates.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/businesses', {
        business_name: form.business_name,
        owner_name: form.owner_name,
        email: form.email,
        password: form.password,
        phone_number: form.phone_number,
        postal_address: form.postal_address,
        location: { lat, lon },
      });
      const token = res.data.resetToken;
      navigate(`/activate/${token}`);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setError('An account with this email already exists.');
      else if (status === 400) setError('Please check your input. Password must be 8-20 characters with uppercase, lowercase, number, and special character.');
      else setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="w-full max-w-lg">
        <div className="card">
          <div className="text-center mb-8">
            <span className="text-4xl">🏥</span>
            <h1 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">Register your business</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Post jobs and find dental professionals</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Business name *</label>
              <input type="text" className="input" placeholder="Downtown Dental Clinic" value={form.business_name} onChange={set('business_name')} required />
            </div>
            <div>
              <label className="label">Owner's full name *</label>
              <input type="text" className="input" placeholder="Dr. Jane Smith" value={form.owner_name} onChange={set('owner_name')} required />
            </div>
            <div>
              <label className="label">Email address *</label>
              <input type="email" className="input" placeholder="clinic@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" placeholder="Min 8 chars, upper/lower/number/special" value={form.password} onChange={set('password')} required />
              <p className="text-xs text-gray-400 mt-1">8-20 chars, uppercase, lowercase, number, special character</p>
            </div>
            <div>
              <label className="label">Phone number *</label>
              <input type="tel" className="input" placeholder="416-555-0200" value={form.phone_number} onChange={set('phone_number')} required />
            </div>
            <div>
              <label className="label">Postal address *</label>
              <input type="text" className="input" placeholder="40 St George St, Toronto, ON" value={form.postal_address} onChange={set('postal_address')} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Latitude *</label>
                <input type="number" step="any" className="input" placeholder="43.6532" value={form.lat} onChange={set('lat')} required />
              </div>
              <div>
                <label className="label">Longitude *</label>
                <input type="number" step="any" className="input" placeholder="-79.3832" value={form.lon} onChange={set('lon')} required />
              </div>
            </div>
            <p className="text-xs text-gray-400">Toronto centre: lat 43.6532, lon -79.3832</p>

            {error && <p className="error-text text-center">{error}</p>}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? 'Creating account…' : 'Create business account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account? <Link to="/login" className="link">Sign in</Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Looking for work? <Link to="/register/user" className="link">Register as a professional</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
