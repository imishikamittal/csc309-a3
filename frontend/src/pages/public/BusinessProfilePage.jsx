// Generated using Claude
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import Avatar from '../../components/Avatar';
import { PageSpinner } from '../../components/Spinner';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function BusinessProfilePage() {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/businesses/${id}`)
      .then(res => setBusiness(res.data))
      .catch(() => setError('Business not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageSpinner />;
  if (error) return (
    <div className="card text-center py-12">
      <p className="text-red-500">{error}</p>
      <Link to="/businesses" className="link mt-4 inline-block">Back to businesses</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/businesses" className="text-sm link mb-4 inline-flex items-center gap-1">
        ← Back to businesses
      </Link>

      <div className="card mt-4">
        <div className="flex items-start gap-6">
          <Avatar src={business.avatar} name={business.business_name} size="xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{business.business_name}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{business.email}</p>
          </div>
        </div>

        {business.biography && (
          <div className="mt-6">
            <h2 className="section-title">About</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{business.biography}</p>
          </div>
        )}

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {business.phone_number && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Phone</p>
              <p className="text-gray-900 dark:text-white mt-1">{business.phone_number}</p>
            </div>
          )}
          {business.postal_address && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Address</p>
              <p className="text-gray-900 dark:text-white mt-1">{business.postal_address}</p>
            </div>
          )}
          {business.location && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Location</p>
              <p className="text-gray-900 dark:text-white mt-1">
                {business.location.lat.toFixed(4)}, {business.location.lon.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
