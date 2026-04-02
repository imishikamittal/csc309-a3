// Generated using Claude
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';

export default function RegisterUserPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '',
    phone_number: '', postal_address: '', birthday: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
      };
      if (form.phone_number) payload.phone_number = form.phone_number;
      if (form.postal_address) payload.postal_address = form.postal_address;
      if (form.birthday) payload.birthday = form.birthday;

      const res = await api.post('/users', payload);
      const token = res.data.resetToken;
      setSuccess(`Account created! Use this token to activate: ${token}`);
      setTimeout(() => navigate(`/activate/${token}`), 1500);
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
            <span className="text-4xl">👤</span>
            <h1 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">Create your account</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Join as a dental professional</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First name *</label>
                <input type="text" className="input" placeholder="Jane" value={form.first_name} onChange={set('first_name')} required />
              </div>
              <div>
                <label className="label">Last name *</label>
                <input type="text" className="input" placeholder="Doe" value={form.last_name} onChange={set('last_name')} required />
              </div>
            </div>
            <div>
              <label className="label">Email address *</label>
              <input type="email" className="input" placeholder="jane@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" placeholder="Min 8 chars, upper/lower/number/special" value={form.password} onChange={set('password')} required />
              <p className="text-xs text-gray-400 mt-1">8-20 chars, uppercase, lowercase, number, special character</p>
            </div>
            <div>
              <label className="label">Phone number</label>
              <input type="tel" className="input" placeholder="416-555-0100" value={form.phone_number} onChange={set('phone_number')} />
            </div>
            <div>
              <label className="label">Postal address</label>
              <input type="text" className="input" placeholder="123 Main St, Toronto, ON" value={form.postal_address} onChange={set('postal_address')} />
            </div>
            <div>
              <label className="label">Birthday</label>
              <input type="date" className="input" value={form.birthday} onChange={set('birthday')} />
            </div>

            {error && <p className="error-text text-center">{error}</p>}
            {success && <p className="text-sm text-green-600 dark:text-green-400 text-center">{success}</p>}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account? <Link to="/login" className="link">Sign in</Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Registering a business? <Link to="/register/business" className="link">Business sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
