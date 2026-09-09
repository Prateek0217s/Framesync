const os = require('os');

// Origin helpers shared by the Express CORS policy, the Socket.io gateway,
// and magic-link generation. In dev the dashboard is reachable under several
// origins at once (localhost + the machine's LAN IP, since Vite runs with
// host: true so teammates on the same Wi-Fi can open it), so CORS accepts any
// localhost/private-network origin. Production deployments set CLIENT_URL and
// sit behind nginx (same-origin), where this permissiveness is never exercised.

const PRIVATE_IPV4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.)/;

const isLocalhostHost = (hostname) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';

// CORS predicate: true for same-origin/no-origin requests, the configured
// CLIENT_URL, and any localhost / private-LAN origin.
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // same-origin request or non-browser client
  try {
    const { hostname } = new URL(origin);
    return (
      origin === process.env.CLIENT_URL ||
      isLocalhostHost(hostname) ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.lan') ||
      PRIVATE_IPV4.test(hostname) ||
      hostname.startsWith('fe80:') ||
      hostname.startsWith('fc') ||
      hostname.startsWith('fd')
    );
  } catch {
    return false;
  }
};

// The machine's first non-internal IPv4 (e.g. 192.168.1.5) — the address
// other devices on the same network can reach.
const lanIPv4 = () => {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const net of ifaces || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
};

// Best base URL for shareable links (magic links). Order:
//  1. the origin the requester is actually browsing from, when it isn't
//     localhost (admin already on http://192.168.x.x:5173)
//  2. CLIENT_URL, when it isn't localhost (deployed environments)
//  3. this machine's LAN IPv4 — links then work on every device on the
//     same network, including the machine that minted them
//  4. localhost fallback (single-machine dev)
// 5173 is the Vite dev port; deployed environments take path 2 instead.
const resolveShareableOrigin = (req) => {
  const headerOrigin = req?.headers?.origin;
  if (headerOrigin) {
    try {
      if (!isLocalhostHost(new URL(headerOrigin).hostname)) return headerOrigin;
    } catch {
      /* malformed header — fall through */
    }
  }
  const envUrl = process.env.CLIENT_URL;
  if (envUrl) {
    try {
      if (!isLocalhostHost(new URL(envUrl).hostname)) return envUrl;
    } catch {
      /* misconfigured CLIENT_URL — fall through */
    }
  }
  const ip = lanIPv4();
  if (ip) return `http://${ip}:5173`;
  return 'http://localhost:5173';
};

module.exports = { isAllowedOrigin, resolveShareableOrigin };
