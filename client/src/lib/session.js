// Single active session (admin OR client magic-link), persisted across reloads.
// Admin and client personas are mutually exclusive per browser in practice, so
// one slot keeps the token/user lookup trivial for the axios + socket layers.
const KEY = 'fs_session';

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function getToken() {
  return getSession()?.token || null;
}
