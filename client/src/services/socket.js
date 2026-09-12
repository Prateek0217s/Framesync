import { io } from 'socket.io-client';
import { getToken } from '../lib/session';

// Same-origin connection; Vite proxies /socket.io -> :5001 (see vite.config.js),
// so there is no CORS surface in dev and no env var to manage.
//
// `auth` is a callback so it is evaluated on every (re)connect attempt rather
// than captured once — the token after a login/logout is always the current
// one. The server verifies it and derives the user's identity from it; nothing
// sent from here is trusted for authorization.
const socket = io({
  autoConnect: false,
  transports: ['websocket', 'polling'],
  auth: (cb) => cb({ token: getToken() }),
});

let joinedProject = null;
let joinedDashboard = false;

export function connectSocket() {
  if (!socket.connected) socket.connect();
  return socket;
}

// Join this agency's private dashboard channel (PDD §5.4.3) for cross-board
// sync. The room is derived server-side from the verified token.
export function joinDashboard() {
  joinedDashboard = true;
  connectSocket();
  const emitJoin = () => socket.emit('join:dashboard');
  if (socket.connected) emitJoin();
  else socket.once('connect', emitJoin);
}

export function leaveDashboard() {
  if (joinedDashboard) socket.emit('leave:dashboard');
  joinedDashboard = false;
}

// Join a project war-room (PDD §5.6.1). The server checks that this user may
// see the project before admitting them. Re-emits on reconnect so presence
// survives dropped sockets.
export function joinProject(projectId) {
  joinedProject = projectId;
  connectSocket();
  const emitJoin = () => socket.emit('join:project', { projectId });
  if (socket.connected) emitJoin();
  else socket.once('connect', emitJoin);
}

export function leaveProject() {
  if (joinedProject) socket.emit('leave:project', { projectId: joinedProject });
  joinedProject = null;
}

// Re-join automatically after a reconnect.
socket.on('connect', () => {
  if (joinedProject) {
    socket.emit('join:project', { projectId: joinedProject });
  }
  if (joinedDashboard) socket.emit('join:dashboard');
});

export function on(event, handler) {
  socket.on(event, handler);
  return () => socket.off(event, handler);
}

export function disconnectSocket() {
  leaveProject();
  leaveDashboard();
  if (socket.connected) socket.disconnect();
}

export default socket;
