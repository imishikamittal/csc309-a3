// Generated using Claude
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    setStatus('loading');
    try {
      await api.post(`/auth/resets/${token}`, { email: form.email, password: form.password });
      setStatus('success');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setStatus('idle');
      const status = err.response?.status;
      if (status === 401) setError('Email does not match this token.');
      else if (status === 404) setError('This token has already been used or does not exist.');
      else if (status === 410) setError('This reset link has expired. Please request a new one.');
      else if (status === 400) setError('Password must be 8-20 characters with uppercase, lowercase, number, and special character.');
      else setError('Reset failed. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="card text-center max-w-md">
          <span className="text-5xl">✅</span>
          <h2 className="text-xl font-bold mt-4 text-gray-900 dark:text-white">Password reset!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <span className="text-4xl">🔒</span>
            <h1 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">Set new password</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Choose a strong new password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                placeholder="New password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
              <p className="text-xs text-gray-400 mt-1">8-20 chars, uppercase, lowercase, number, special character</p>
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                className="input"
                placeholder="Confirm new password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                required
              />
            </div>

            {error && <p className="error-text text-center">{error}</p>}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={status === 'loading'}>
              {status === 'loading' ? 'Resetting…' : 'Reset password'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="link text-sm">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
