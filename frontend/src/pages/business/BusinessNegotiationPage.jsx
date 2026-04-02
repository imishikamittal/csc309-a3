// Generated using Claude
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = Math.max(0, new Date(expiresAt) - new Date());
      setRemaining(Math.floor(diff / 1000));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return { display: `${mins}:${secs.toString().padStart(2, '0')}`, remaining };
}

export default function BusinessNegotiationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [negotiation, setNegotiation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [loading, setLoading] = useState(true);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { display: countdown, remaining } = useCountdown(negotiation?.expiresAt);

  const fetchNegotiation = useCallback(async () => {
    try {
      const res = await api.get('/negotiations/me');
      setNegotiation(res.data);
    } catch {
      setNegotiation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNegotiation();
  }, [fetchNegotiation]);

  useEffect(() => {
    if (!negotiation?.id) return;
    const token = localStorage.getItem('token');
    const socket = io(BASE_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('negotiation:message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socket.on('negotiation:started', () => {
      fetchNegotiation();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [negotiation?.id, fetchNegotiation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!msgText.trim() || !socketRef.current || !negotiation) return;
    socketRef.current.emit('negotiation:message', {
      negotiation_id: negotiation.id,
      text: msgText.trim(),
    });
    setMsgText('');
  };

  const makeDecision = async (decision) => {
    setError('');
    setDecisionLoading(true);
    try {
      await api.patch('/negotiations/me/decision', {
        decision,
        negotiation_id: negotiation.id,
      });
      await fetchNegotiation();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit decision.');
    } finally {
      setDecisionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!negotiation || negotiation.status !== 'active') {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card text-center py-12">
          <span className="text-5xl">{negotiation?.status === 'success' ? '🎉' : negotiation?.status === 'failed' ? '❌' : '💬'}</span>
          <h2 className="text-xl font-bold mt-4 text-gray-900 dark:text-white">
            {negotiation?.status === 'success'
              ? 'Job Filled!'
              : negotiation?.status === 'failed'
              ? 'Negotiation Ended'
              : negotiation?.status === 'expired'
              ? 'Negotiation Expired'
              : 'No Active Negotiation'}
          </h2>
          {negotiation?.status === 'success' && (
            <p className="text-gray-500 dark:text-gray-400 mt-2">The job has been filled successfully.</p>
          )}
          <Link to="/business/jobs" className="btn-primary mt-6 inline-flex">Go to My Jobs</Link>
        </div>
      </div>
    );
  }

  const myDecision = negotiation.decisions?.business;
  const otherDecision = negotiation.decisions?.candidate;
  const isExpired = remaining === 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title mb-0">Active Negotiation</h1>
        <div className={`font-mono text-lg font-bold px-3 py-1 rounded-lg ${
          remaining < 120
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          ⏱ {countdown}
        </div>
      </div>

      <div className="card mb-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Position</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-1">{negotiation.job?.position_type?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Candidate</p>
            <p className="font-semibold text-gray-900 dark:text-white mt-1">
              {negotiation.user?.first_name} {negotiation.user?.last_name}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Salary</p>
            <p className="text-gray-900 dark:text-white mt-1">${negotiation.job?.salary_min}-${negotiation.job?.salary_max}/hr</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Work time</p>
            <p className="text-gray-900 dark:text-white mt-1">
              {new Date(negotiation.job?.start_time).toLocaleDateString()} - {new Date(negotiation.job?.end_time).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-4">
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Your decision</p>
            <span className={`badge ${myDecision === 'accept' ? 'badge-green' : myDecision === 'decline' ? 'badge-red' : 'badge-gray'}`}>
              {myDecision ?? 'Pending'}
            </span>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Candidate decision</p>
            <span className={`badge ${otherDecision === 'accept' ? 'badge-green' : otherDecision === 'decline' ? 'badge-red' : 'badge-gray'}`}>
              {otherDecision ?? 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {!isExpired && !myDecision && (
        <div className="card mb-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700">
          <p className="text-sm text-amber-800 dark:text-amber-300 mb-3 font-medium">
            Do you want to fill this position with this candidate?
          </p>
          {error && <p className="error-text mb-2">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => makeDecision('accept')} disabled={decisionLoading} className="btn-primary">
              {decisionLoading ? '…' : '✓ Accept'}
            </button>
            <button onClick={() => makeDecision('decline')} disabled={decisionLoading} className="btn-danger">
              {decisionLoading ? '…' : '✗ Decline'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="section-title">Chat</h2>
        <div className="min-h-[200px] max-h-[300px] overflow-y-auto space-y-2 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.sender?.role === 'business';
              return (
                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                    isMe
                      ? 'bg-primary-600 text-white dark:bg-primary-500'
                      : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-500'
                  }`}>
                    {msg.text}
                    <div className={`text-xs mt-1 ${isMe ? 'text-primary-100' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Type a message…"
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            disabled={isExpired}
          />
          <button type="submit" className="btn-primary px-4" disabled={!msgText.trim() || isExpired}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
