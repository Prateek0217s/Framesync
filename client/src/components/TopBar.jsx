import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Brand from './Brand';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

// Agency-side top navigation.
export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3">
        <Link to="/">
          <Brand />
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-slate-200">
              {user?.name || 'Admin'}
            </p>
            <p className="text-xs leading-tight text-slate-500">
              {user?.email} · Agency
            </p>
          </div>
          <ThemeToggle />
          <button type="button" onClick={doLogout} className="fs-btn-ghost px-3 py-2 text-sm">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
