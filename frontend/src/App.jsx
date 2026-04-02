// Generated using Claude
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { PageSpinner } from './components/Spinner';
import NegotiationBanner from './components/NegotiationBanner';

import LandingPage from './pages/public/LandingPage';
import BusinessesPage from './pages/public/BusinessesPage';
import BusinessProfilePage from './pages/public/BusinessProfilePage';

import LoginPage from './pages/auth/LoginPage';
import RegisterUserPage from './pages/auth/RegisterUserPage';
import RegisterBusinessPage from './pages/auth/RegisterBusinessPage';
import ActivatePage from './pages/auth/ActivatePage';
import ResetRequestPage from './pages/auth/ResetRequestPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import UserProfilePage from './pages/regular/UserProfilePage';
import EditProfilePage from './pages/regular/EditProfilePage';
import QualificationsPage from './pages/regular/QualificationsPage';
import JobsPage from './pages/regular/JobsPage';
import JobDetailPage from './pages/regular/JobDetailPage';
import InvitationsPage from './pages/regular/InvitationsPage';
import InterestsPage from './pages/regular/InterestsPage';
import CommitmentsPage from './pages/regular/CommitmentsPage';
import NegotiationPage from './pages/regular/NegotiationPage';

import BusinessProfileViewPage from './pages/business/BusinessProfileViewPage';
import EditBusinessProfilePage from './pages/business/EditBusinessProfilePage';
import BusinessJobsPage from './pages/business/BusinessJobsPage';
import CreateJobPage from './pages/business/CreateJobPage';
import BusinessJobDetailPage from './pages/business/BusinessJobDetailPage';
import CandidatesPage from './pages/business/CandidatesPage';
import CandidateDetailPage from './pages/business/CandidateDetailPage';
import JobInterestsPage from './pages/business/JobInterestsPage';
import BusinessNegotiationPage from './pages/business/BusinessNegotiationPage';

import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminBusinessesPage from './pages/admin/AdminBusinessesPage';
import AdminPositionTypesPage from './pages/admin/AdminPositionTypesPage';
import AdminQualificationsPage from './pages/admin/AdminQualificationsPage';
import AdminQualificationReviewPage from './pages/admin/AdminQualificationReviewPage';
import AdminSystemPage from './pages/admin/AdminSystemPage';

function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (user) {
    if (user.role === 'regular') return <Navigate to="/jobs" replace />;
    if (user.role === 'business') return <Navigate to="/business/jobs" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/users" replace />;
  }
  return children;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <PageSpinner />;

  return (
    <div className="min-h-screen">
      <Navbar />
      <NegotiationBanner />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/businesses" element={<BusinessesPage />} />
          <Route path="/businesses/:id" element={<BusinessProfilePage />} />

          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register/user" element={<GuestOnly><RegisterUserPage /></GuestOnly>} />
          <Route path="/register/business" element={<GuestOnly><RegisterBusinessPage /></GuestOnly>} />
          <Route path="/activate/:token" element={<ActivatePage />} />
          <Route path="/reset-password" element={<ResetRequestPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          <Route path="/profile" element={<RequireAuth role="regular"><UserProfilePage /></RequireAuth>} />
          <Route path="/profile/edit" element={<RequireAuth role="regular"><EditProfilePage /></RequireAuth>} />
          <Route path="/qualifications" element={<RequireAuth role="regular"><QualificationsPage /></RequireAuth>} />
          <Route path="/jobs" element={<RequireAuth role="regular"><JobsPage /></RequireAuth>} />
          <Route path="/jobs/:id" element={<RequireAuth role="regular"><JobDetailPage /></RequireAuth>} />
          <Route path="/invitations" element={<RequireAuth role="regular"><InvitationsPage /></RequireAuth>} />
          <Route path="/interests" element={<RequireAuth role="regular"><InterestsPage /></RequireAuth>} />
          <Route path="/commitments" element={<RequireAuth role="regular"><CommitmentsPage /></RequireAuth>} />
          <Route path="/negotiation" element={<RequireAuth role="regular"><NegotiationPage /></RequireAuth>} />

          <Route path="/business/profile" element={<RequireAuth role="business"><BusinessProfileViewPage /></RequireAuth>} />
          <Route path="/business/profile/edit" element={<RequireAuth role="business"><EditBusinessProfilePage /></RequireAuth>} />
          <Route path="/business/jobs" element={<RequireAuth role="business"><BusinessJobsPage /></RequireAuth>} />
          <Route path="/business/jobs/new" element={<RequireAuth role="business"><CreateJobPage /></RequireAuth>} />
          <Route path="/business/jobs/:id" element={<RequireAuth role="business"><BusinessJobDetailPage /></RequireAuth>} />
          <Route path="/business/jobs/:id/candidates" element={<RequireAuth role="business"><CandidatesPage /></RequireAuth>} />
          <Route path="/business/jobs/:id/candidates/:userId" element={<RequireAuth role="business"><CandidateDetailPage /></RequireAuth>} />
          <Route path="/business/jobs/:id/interests" element={<RequireAuth role="business"><JobInterestsPage /></RequireAuth>} />
          <Route path="/business/negotiation" element={<RequireAuth role="business"><BusinessNegotiationPage /></RequireAuth>} />

          <Route path="/admin/users" element={<RequireAuth role="admin"><AdminUsersPage /></RequireAuth>} />
          <Route path="/admin/businesses" element={<RequireAuth role="admin"><AdminBusinessesPage /></RequireAuth>} />
          <Route path="/admin/position-types" element={<RequireAuth role="admin"><AdminPositionTypesPage /></RequireAuth>} />
          <Route path="/admin/qualifications" element={<RequireAuth role="admin"><AdminQualificationsPage /></RequireAuth>} />
          <Route path="/admin/qualifications/:id" element={<RequireAuth role="admin"><AdminQualificationReviewPage /></RequireAuth>} />
          <Route path="/admin/system" element={<RequireAuth role="admin"><AdminSystemPage /></RequireAuth>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
