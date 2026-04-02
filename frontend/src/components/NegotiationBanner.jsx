// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

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
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function NegotiationBanner() {
  const { user } = useAuth();
  const [negotiation, setNegotiation] = useState(null);
  const countdown = useCountdown(negotiation?.expiresAt);

  const fetchNegotiation = useCallback(async () => {
    if (!user || user.role === 'admin') return;
    try {
      const res = await api.get('/negotiations/me');
      if (res.data?.status === 'active') {
        setNegotiation(res.data);
      } else {
        setNegotiation(null);
      }
    } catch {
      setNegotiation(null);
    }
  }, [user]);

  useEffect(() => {
    fetchNegotiation();
    const id = setInterval(fetchNegotiation, 15000);
    return () => clearInterval(id);
  }, [fetchNegotiation]);

  if (!negotiation) return null;

  const negotiationLink = user?.role === 'regular' ? '/negotiation' : '/business/negotiation';

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-amber-800 dark:text-amber-300 font-medium">
            Active negotiation in progress
          </span>
          <span className="text-amber-700 dark:text-amber-400">
            - {negotiation.job?.position_type?.name} at {negotiation.job?.business?.business_name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-800 dark:text-amber-300 font-mono text-sm font-semibold">
            ⏱ {countdown}
          </span>
          <Link to={negotiationLink} className="btn-primary text-xs px-3 py-1.5">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
