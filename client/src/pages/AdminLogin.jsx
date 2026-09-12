import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Brand from '../components/Brand';
import ThemeToggle from '../components/ThemeToggle';
import useTheme from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Google Identity Services renders its own button into a container we own.
// Returns nothing at all when no Client ID is configured, so an unconfigured
// deployment shows the plain email+password form rather than a broken widget.
function GoogleSignIn({ onCredential, disabled }) {
  const light = useTheme();
  const holder = useRef(null);
  const [ready, setReady] = useState(false);

  // Held in a ref so the render effect below doesn't re-run (and rebuild the
  // button) every time the parent re-renders with a new callback identity.
  const credentialHandler = useRef(onCredential);
  credentialHandler.current = onCredential;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;

    // The GIS script is async/defer, so window.google may not exist yet on
    // first render — poll briefly, then give up quietly.
    let cancelled = false;
    let tries = 0;
    const timer = setInterval(() => {
      if (cancelled) return;
      if (window.google?.accounts?.id) {
        clearInterval(timer);
        setReady(true);
      } else if (++tries > 100) {
        clearInterval(timer);
      }
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!ready || !holder.current) return;

    // GIS *appends* its iframe on every renderButton call, so a re-render
    // (e.g. a theme flip, which changes the button theme) would stack a second
    // button on top of the first. Clear the container first.
    holder.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: ({ credential }) => credentialHandler.current(credential),
    });
    window.google.accounts.id.renderButton(holder.current, {
      type: 'standard',
      theme: light ? 'outline' : 'filled_black',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: 320,
    });
  }, [ready, light]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className={`mb-5 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <div className="flex justify-center" ref={holder} />
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line/10" />
        <span className="text-xs uppercase tracking-wide text-slate-500">or</span>
        <span className="h-px flex-1 bg-line/10" />
      </div>
    </div>
  );
}

export default function AdminLogin() {
  const { loginAdmin, loginWithGoogle } = useAuth();
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

  const handleGoogle = async (credential) => {
    setBusy(true);
    try {
      await loginWithGoogle(credential);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    // The global Light Ripple backdrop (App.jsx) shows through here in both
    // themes — dark ripple on black, inverted ice arcs on white.
    <div className="relative grid min-h-screen place-items-center p-6">
      {/* Theme toggle — the login page renders outside TopBar, so mount it
          here in the corner. */}
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
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

          <GoogleSignIn onCredential={handleGoogle} disabled={busy} />

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
