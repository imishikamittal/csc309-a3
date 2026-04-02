// Generated using Claude
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';

export default function ResetRequestPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('loading');
    try {
      const res = await api.post('/auth/resets', { email });
      setToken(res.data.resetToken);
      setStatus('success');
    } catch (err) {
      setStatus('idle');
      const status = err.response?.status;
      if (status === 404) setError('No account found with that email address.');
      else if (status === 429) setError('Too many requests. Please wait before trying again.');
      else setError('Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="card text-center max-w-md">
          <span className="text-5xl">📬</span>
          <h2 className="text-xl font-bold mt-4 text-gray-900 dark:text-white">Reset token generated</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 mb-4">
            In a real system this would be emailed. Use the token below to reset your password.
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 font-mono text-sm break-all mb-4">
            {token}
          </div>
          <button
            onClick={() => navigate(`/reset-password/${token}`)}
            className="btn-primary"
          >
            Continue to reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <span className="text-4xl">🔑</span>
            <h1 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">Reset your password</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Enter your email to receive a reset token</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && <p className="error-text text-center">{error}</p>}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending…' : 'Get reset token'}
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
