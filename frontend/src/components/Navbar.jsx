import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Icons from Heroicons (https://heroicons.com/) - MIT License, Tailwind Labs
function SunIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const activeClass = 'text-primary-600 dark:text-primary-400 font-medium';
const inactiveClass = 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  const navLinks = () => {
    if (!user) {
      return [
        { to: '/businesses', label: 'Businesses' },
      ];
    }
    if (user.role === 'regular') {
      return [
        { to: '/jobs', label: 'Browse Jobs' },
        { to: '/invitations', label: 'Invitations' },
        { to: '/interests', label: 'My Interests' },
        { to: '/commitments', label: 'Commitments' },
        { to: '/qualifications', label: 'Qualifications' },
      ];
    }
    if (user.role === 'business') {
      return [
        { to: '/business/jobs', label: 'My Jobs' },
        { to: '/businesses', label: 'Directory' },
      ];
    }
    if (user.role === 'admin') {
      return [
        { to: '/admin/users', label: 'Users' },
        { to: '/admin/businesses', label: 'Businesses' },
        { to: '/admin/position-types', label: 'Positions' },
        { to: '/admin/qualifications', label: 'Reviews' },
        { to: '/admin/system', label: 'System' },
      ];
    }
    return [];
  };

  const profileLink = () => {
    if (user?.role === 'regular') return '/profile';
    if (user?.role === 'business') return '/business/profile';
    return null;
  };

  const displayName = () => {
    if (!user) return '';
    if (user.role === 'regular') return user.first_name || user.email;
    if (user.role === 'business') return user.business_name || user.email;
    return user.email || 'Admin';
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-primary-600 dark:text-primary-400 text-lg">
            <span className="text-2xl">🦷</span>
            <span>Dental_Ishika_Raymond</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks().map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setDark(d => !d)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Toggle dark mode"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                {profileLink() && (
                  <NavLink
                    to={profileLink()}
                    className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition"
                  >
                    {displayName()}
                  </NavLink>
                )}
                <button onClick={handleLogout} className="btn-secondary text-sm px-3 py-1.5">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-outline text-sm px-3 py-1.5">Login</Link>
                <Link to="/register/user" className="btn-primary text-sm px-3 py-1.5">Sign Up</Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            onClick={() => setOpen(o => !o)}
          >
            {open ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-4 space-y-3">
          {navLinks().map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `block py-2 ${isActive ? activeClass : inactiveClass}`}
            >
              {l.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <button
              onClick={() => setDark(d => !d)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            {user ? (
              <>
                {profileLink() && (
                  <NavLink to={profileLink()} onClick={() => setOpen(false)} className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {displayName()}
                  </NavLink>
                )}
                <button onClick={handleLogout} className="btn-secondary text-sm px-3 py-1.5">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="btn-outline text-sm px-3 py-1.5">Login</Link>
                <Link to="/register/user" onClick={() => setOpen(false)} className="btn-primary text-sm px-3 py-1.5">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
