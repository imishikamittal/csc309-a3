// Generated using Claude
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import Avatar from '../../components/Avatar';
import { PageSpinner } from '../../components/Spinner';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function CandidateDetailPage() {
  const { id: jobId, userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [interest, setInterest] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/jobs/${jobId}/candidates/${userId}`);
        setData(res.data);

        const interestsRes = await api.get(`/jobs/${jobId}/interests`);
        const found = interestsRes.data.results?.find(i => i.user?.id === parseInt(userId));
        setInterest(found || null);
      } catch (err) {
        const status = err.response?.status;
        if (status === 403) setError('This candidate is no longer discoverable.');
        else if (status === 404) setError('Candidate not found.');
        else setError('Failed to load candidate.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [jobId, userId]);

  const handleInvite = async (interested) => {
    setInviteError('');
    setInviteMsg('');
    setInviteLoading(true);
    try {
      await api.patch(`/jobs/${jobId}/candidates/${userId}/interested`, { interested });
      setInviteMsg(interested ? 'Invitation sent!' : 'Invitation withdrawn.');
      if (interested) {
        const interestsRes = await api.get(`/jobs/${jobId}/interests`);
        const found = interestsRes.data.results?.find(i => i.user?.id === parseInt(userId));
        setInterest(found || null);
      } else {
        setInterest(null);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) setInviteError('Nothing to withdraw.');
      else if (status === 403) setInviteError('Candidate is no longer discoverable.');
      else if (status === 409) setInviteError('Job is not accepting invitations right now.');
      else setInviteError('Action failed.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleNegotiate = async () => {
    if (!interest) return;
    setInviteLoading(true);
    setInviteError('');
    try {
      await api.post('/negotiations', { interest_id: interest.interest_id });
      navigate('/business/negotiation');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setInviteError(err.response?.data?.error || 'Cannot start negotiation now.');
      else if (status === 403) setInviteError('Mutual interest required.');
      else setInviteError('Failed to start negotiation.');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (error) return (
    <div className="card text-center py-12 max-w-xl mx-auto">
      <p className="text-red-500">{error}</p>
      <Link to={`/business/jobs/${jobId}/candidates`} className="btn-secondary mt-4 inline-flex">Back to candidates</Link>
    </div>
  );

  const { user: candidate, job } = data || {};

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <Link to={`/business/jobs/${jobId}/candidates`} className="text-sm link">← Back to candidates</Link>
      </div>

      <div className="card mt-2 mb-4">
        <div className="flex items-start gap-6">
          <Avatar src={candidate?.avatar} name={`${candidate?.first_name} ${candidate?.last_name}`} size="xl" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {candidate?.first_name} {candidate?.last_name}
            </h1>
            {candidate?.email && <p className="text-gray-500 dark:text-gray-400">{candidate.email}</p>}
            {candidate?.phone_number && <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.phone_number}</p>}
          </div>
        </div>

        {candidate?.biography && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">About</p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{candidate.biography}</p>
          </div>
        )}

        {candidate?.resume && (
          <div className="mt-4">
            <a
              href={`${BASE_URL}${candidate.resume}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
            >
              📄 View Resume
            </a>
          </div>
        )}
      </div>

      {candidate?.qualification && (
        <div className="card mb-4">
          <h2 className="section-title">Qualification</h2>
          <p className="text-gray-700 dark:text-gray-300">{candidate.qualification.note || 'No additional notes.'}</p>
          {candidate.qualification.document && (
            <a
              href={`${BASE_URL}${candidate.qualification.document}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mt-2"
            >
              📄 View Qualification Document
            </a>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Updated: {new Date(candidate.qualification.updatedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="section-title">Actions</h2>

        {inviteMsg && <p className="text-sm text-green-600 dark:text-green-400 mb-3">{inviteMsg}</p>}
        {inviteError && <p className="error-text mb-3">{inviteError}</p>}

        <div className="flex flex-wrap gap-3">
          {!interest?.business?.interested ? (
            <button
              onClick={() => handleInvite(true)}
              disabled={inviteLoading}
              className="btn-primary"
            >
              {inviteLoading ? '…' : '📨 Invite to Apply'}
            </button>
          ) : (
            <>
              <span className="badge-teal">Invited</span>
              {interest?.mutual && (
                <button
                  onClick={handleNegotiate}
                  disabled={inviteLoading}
                  className="btn-primary"
                >
                  {inviteLoading ? '…' : '🤝 Start Negotiation'}
                </button>
              )}
              <button
                onClick={() => handleInvite(false)}
                disabled={inviteLoading}
                className="btn-secondary"
              >
                Withdraw Invitation
              </button>
            </>
          )}
        </div>

        {interest?.mutual && (
          <p className="text-sm text-teal-600 dark:text-teal-400 mt-2">
            ✓ Both parties have expressed interest. You can now start a negotiation!
          </p>
        )}
      </div>
    </div>
  );
}
