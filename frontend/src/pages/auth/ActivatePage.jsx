// Generated using Claude
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';

export default function ActivatePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleActivate = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('loading');
    try {
      const payload = { email };
      if (newPassword) payload.password = newPassword;
      await api.post(`/auth/resets/${token}`, payload);
      setStatus('success');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setStatus('idle');
      const status = err.response?.status;
      if (status === 401) setError('Email does not match this token.');
      else if (status === 404) setError('This token has already been used or does not exist.');
      else if (status === 410) setError('This activation link has expired. Please request a new one.');
      else setError('Activation failed. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="card text-center max-w-md">
          <span className="text-5xl">✅</span>
          <h2 className="text-xl font-bold mt-4 text-gray-900 dark:text-white">Account activated!</h2>
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
            <span className="text-4xl">📧</span>
            <h1 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">Activate your account</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Enter your email to confirm activation</p>
          </div>

          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">New password (optional)</label>
              <input
                type="password"
                className="input"
                placeholder="Leave blank to keep current password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Only fill this if you want to set a new password</p>
            </div>

            {error && <p className="error-text text-center">{error}</p>}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={status === 'loading'}>
              {status === 'loading' ? 'Activating…' : 'Activate account'}
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
