import React from 'react';
import { Link } from 'react-router-dom';
import { Frown } from 'lucide-react';
import Brand from '../components/Brand';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Brand size="lg" />
        <Frown className="text-slate-600" size={40} />
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="max-w-sm text-sm text-slate-400">
          This link may have expired or the page doesn’t exist.
        </p>
        <Link to="/" className="fs-btn-primary">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
