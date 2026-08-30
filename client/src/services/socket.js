import { io } from 'socket.io-client';

// Same-origin connection; Vite proxies /socket.io -> :5000 (see vite.config.js),
// so there is no CORS surface in dev and no env var to manage.
const socket = io({
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

let joinedProject = null;
let joinedUser = null;
let joinedDashboard = false;

export function connectSocket() {
  if (!socket.connected) socket.connect();
  return socket;
}

// Join the shared agency dashboard channel (PDD §5.4.3) for cross-board sync.
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

// Join a project war-room (PDD §5.6.1). Re-emits on reconnect so presence
// survives dropped sockets.
export function joinProject(projectId, user) {
  joinedProject = projectId;
  joinedUser = user;
  connectSocket();
  const emitJoin = () => socket.emit('join:project', { projectId, user });
  if (socket.connected) emitJoin();
  else socket.once('connect', emitJoin);
}

export function leaveProject() {
  if (joinedProject) socket.emit('leave:project', { projectId: joinedProject });
  joinedProject = null;
  joinedUser = null;
}

// Re-join automatically after a reconnect.
socket.on('connect', () => {
  if (joinedProject) {
    socket.emit('join:project', { projectId: joinedProject, user: joinedUser });
  }
  if (joinedDashboard) socket.emit('join:dashboard');
});

export function on(event, handler) {
  socket.on(event, handler);
  return () => socket.off(event, handler);
}

export function disconnectSocket() {
  leaveProject();
  if (socket.connected) socket.disconnect();
}

export default socket;
