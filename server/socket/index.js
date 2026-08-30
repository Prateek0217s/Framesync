const { Server } = require('socket.io');

// Socket.io real-time gateway (PDD §5.6 / §8.2).
// Rooms are keyed `project:${projectId}`. Controllers broadcast domain events
// (comment:new, comment:resolved, project:statusChanged, project:approved) via
// emitToProject(); presence is handled here.
let io = null;

const roomName = (projectId) => `project:${projectId}`;

// True if another still-connected socket in this room represents the same user
// (e.g. a second browser tab). Lets us keep a user "present" until their last
// socket leaves, instead of dropping them when any one tab closes.
const userHasOtherSocket = (room, userId, exceptId) => {
  if (!io || !userId) return false;
  const members = io.sockets.adapter.rooms.get(room);
  if (!members) return false;
  for (const id of members) {
    if (id === exceptId) continue;
    const s = io.sockets.sockets.get(id);
    if (s?.data?.user?.userId === userId) return true;
  }
  return false;
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // A participant joins a project review room.
    socket.on('join:project', ({ projectId, user } = {}) => {
      if (!projectId) return;
      const room = roomName(projectId);
      socket.join(room);
      socket.data.user = user || { name: 'Guest' };
      socket.data.projectId = projectId;

      // Tell the room this user is now present.
      socket.to(room).emit('user:presence', {
        userId: user?.userId || socket.id,
        name: user?.name || 'Guest',
        active: true,
      });

      // Backfill the joining socket with everyone already in the room.
      const members = io.sockets.adapter.rooms.get(room);
      if (members) {
        for (const id of members) {
          if (id === socket.id) continue;
          const s = io.sockets.sockets.get(id);
          if (s?.data?.user) {
            socket.emit('user:presence', {
              userId: s.data.user.userId || id,
              name: s.data.user.name || 'Guest',
              active: true,
            });
          }
        }
      }
    });

    // Agency dashboards join a shared channel so Kanban stage changes and
    // approvals sync across every open board (PDD §5.4.3).
    socket.on('join:dashboard', () => socket.join('dashboard'));
    socket.on('leave:dashboard', () => socket.leave('dashboard'));

    socket.on('leave:project', ({ projectId } = {}) => {
      if (!projectId) return;
      const room = roomName(projectId);
      if (!userHasOtherSocket(room, socket.data.user?.userId, socket.id)) {
        socket.to(room).emit('user:presence', {
          userId: socket.data.user?.userId || socket.id,
          name: socket.data.user?.name || 'Guest',
          active: false,
        });
      }
      socket.leave(room);
    });

    // 'disconnecting' fires while room membership is still intact, so we can
    // check whether the user has other open sockets before marking them away.
    socket.on('disconnecting', () => {
      const { projectId, user } = socket.data || {};
      if (projectId) {
        const room = roomName(projectId);
        if (!userHasOtherSocket(room, user?.userId, socket.id)) {
          socket.to(room).emit('user:presence', {
            userId: user?.userId || socket.id,
            name: user?.name || 'Guest',
            active: false,
          });
        }
      }
    });
  });

  return io;
};

const getIO = () => io;

// Broadcast a domain event to everyone in a project room.
const emitToProject = (projectId, event, payload) => {
  if (io) io.to(roomName(projectId)).emit(event, payload);
};

// Broadcast to every open agency dashboard (Kanban sync).
const emitToDashboard = (event, payload) => {
  if (io) io.to('dashboard').emit(event, payload);
};

module.exports = { initSocket, getIO, emitToProject, emitToDashboard };
