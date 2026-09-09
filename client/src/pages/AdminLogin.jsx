import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Brand from '../components/Brand';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export default function AdminLogin() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'register') {
        await authApi.register(form);
        toast.success('Account created');
      }
      await loginAdmin(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    // The global Light Ripple backdrop (App.jsx) shows through here in the
    // dark theme; the cream theme paints over it.
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Brand size="lg" />
          <p className="text-sm text-slate-400">
            Agency workspace — video review &amp; conditional delivery
          </p>
        </div>

        <div className="fs-card p-6">
          <div className="mb-5 flex rounded-lg border border-line/10 bg-ink-900/60 p-1">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md py-2 text-sm font-medium capitalize transition ${
                  mode === m ? 'bg-primary text-[#062430]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div>
                <label className="fs-label">Full name</label>
                <div className="relative">
                  <User size={16} className="pointer-events-none absolute left-3 top-3 text-slate-500" />
                  <input
                    required
                    value={form.name}
                    onChange={set('name')}
                    className="fs-input pl-9"
                    placeholder="Marcus Vance"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="fs-label">Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-3 text-slate-500" />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  className="fs-input pl-9"
                  placeholder="you@studio.com"
                />
              </div>
            </div>

            <div>
              <label className="fs-label">Password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-3 text-slate-500" />
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  className="fs-input pl-9"
                  placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                  minLength={mode === 'register' ? 8 : undefined}
                />
              </div>
            </div>

            <button type="submit" disabled={busy} className="fs-btn-primary mt-1">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {mode === 'register' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          Client reviewers don’t sign in here — they use a secure magic link.
        </p>
      </div>
    </div>
  );
}
