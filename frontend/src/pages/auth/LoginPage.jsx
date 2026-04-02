// Generated using Claude
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'regular') navigate('/jobs');
      else if (user.role === 'business') navigate('/business/jobs');
      else if (user.role === 'admin') navigate('/admin/users');
      else navigate('/');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setError('Invalid email or password.');
      else if (status === 403) setError('Account not activated. Check your email for activation link.');
      else setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <span className="text-4xl">🦷</span>
            <h1 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">Welcome back</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            {error && <p className="error-text text-center">{error}</p>}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link to="/reset-password" className="link text-sm">Forgot your password?</Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No account?{' '}
              <Link to="/register/user" className="link">Register as a professional</Link>
              {' '}or{' '}
              <Link to="/register/business" className="link">as a business</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
