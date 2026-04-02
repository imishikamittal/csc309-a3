// Generated using Claude
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-16">
      <section className="text-center py-16">
        <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <span>🦷</span> Dental Staffing Platform
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
          Connect dental professionals<br />
          <span className="text-primary-600 dark:text-primary-400">with clinics that need them</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          A platform for dental clinics to find qualified temporary staff and for dental professionals to discover short-term work opportunities.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
          {!user ? (
            <>
              <Link to="/register/user" className="btn-primary px-6 py-3 text-base">
                Find work as a professional
              </Link>
              <Link to="/register/business" className="btn-outline px-6 py-3 text-base">
                Post jobs as a clinic
              </Link>
            </>
          ) : user.role === 'regular' ? (
            <Link to="/jobs" className="btn-primary px-6 py-3 text-base">Browse available jobs</Link>
          ) : user.role === 'business' ? (
            <Link to="/business/jobs" className="btn-primary px-6 py-3 text-base">Manage your jobs</Link>
          ) : (
            <Link to="/admin/users" className="btn-primary px-6 py-3 text-base">Admin Dashboard</Link>
          )}
          <Link to="/businesses" className="btn-secondary px-6 py-3 text-base">
            Browse clinics
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Discover Jobs</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Browse open positions that match your qualifications, with distance and travel time estimates.
          </p>
        </div>
        <div className="card text-center">
          <div className="text-4xl mb-4">🤝</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mutual Interest</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Express interest in jobs or candidates, and start a negotiation when both parties agree.
          </p>
        </div>
        <div className="card text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fast Negotiation</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Real-time negotiation with a timed window. Chat, accept or decline, and confirm in minutes.
          </p>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">For Dental Professionals</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">✓</span> Browse open jobs matching your qualifications</li>
            <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">✓</span> Set your availability and get discovered by clinics</li>
            <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">✓</span> Negotiate in real time with a dedicated chat window</li>
            <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">✓</span> Track all your commitments and job history</li>
          </ul>
          {!user && (
            <Link to="/register/user" className="btn-primary mt-4 inline-flex">Get started</Link>
          )}
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">For Dental Clinics</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">✓</span> Post short-term job openings with flexible schedules</li>
            <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">✓</span> Search qualified and available professionals nearby</li>
            <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">✓</span> Review qualifications and resumes before inviting</li>
            <li className="flex items-start gap-2"><span className="text-primary-500 mt-0.5">✓</span> Manage all your job postings in one place</li>
          </ul>
          {!user && (
            <Link to="/register/business" className="btn-outline mt-4 inline-flex">Register your clinic</Link>
          )}
        </div>
      </section>
    </div>
  );
}
