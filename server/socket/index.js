const { Server } = require('socket.io');
const { isAllowedOrigin } = require('../utils/originAllowlist');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Project = require('../models/Project');

// Socket.io real-time gateway (PDD §5.6 / §8.2).
// Project rooms are keyed `project:${projectId}`; each agency's dashboard gets
// the private room `dashboard:${ownerId}` so Kanban sync never crosses tenants.
// Controllers broadcast domain events (comment:new, comment:resolved,
// project:statusChanged, project:approved) via emitToProject()/emitToDashboard();
// presence is handled here.
let io = null;

const roomName = (projectId) => `project:${projectId}`;
const dashboardRoom = (ownerId) => `dashboard:${ownerId}`;

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
      origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
      credentials: true,
    },
  });

  // Authenticate the handshake before any event is accepted. Presence, room
  // routing and access checks all read this verified identity — the payload a
  // client sends with join:* is never trusted, so guessing a projectId can't
  // get you into another agency's review room.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Not authorized, no token'));
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select('name role').lean();
      if (!user) return next(new Error('Not authorized, user not found'));
      socket.data.user = {
        userId: String(user._id),
        name: user.name,
        role: user.role,
        // Only admins own a workspace; a client reviewer has no dashboard.
        ownerId: user.role === 'admin' ? String(user._id) : null,
        clientId: decoded.clientId ? String(decoded.clientId) : null,
        projectId: decoded.projectId ? String(decoded.projectId) : null,
      };
      return next();
    } catch (error) {
      return next(new Error('Not authorized, token failed'));
    }
  });

  // May this socket see this project? Mirrors authorizeProjectAccess: an admin
  // must own the project, a client reviewer must be scoped to exactly it.
  const canAccessProject = async (socket, projectId) => {
    const me = socket.data.user;
    if (!me) return false;
    if (me.role === 'admin') {
      return !!(await Project.exists({ _id: projectId, ownerId: me.userId }));
    }
    return me.projectId === String(projectId);
  };

  io.on('connection', (socket) => {
    const me = socket.data.user;

    // A participant joins a project review room.
    socket.on('join:project', async ({ projectId } = {}) => {
      if (!projectId) return;
      if (!(await canAccessProject(socket, projectId))) {
        return socket.emit('error:forbidden', { message: 'Access denied for this project' });
      }
      const room = roomName(projectId);
      socket.join(room);
      socket.data.projectId = String(projectId);

      // Tell the room this user is now present.
      socket.to(room).emit('user:presence', {
        userId: me.userId,
        name: me.name,
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
              userId: s.data.user.userId,
              name: s.data.user.name,
              active: true,
            });
          }
        }
      }
    });

    // Agency dashboards join their own private channel so Kanban stage changes
    // and approvals sync across that agency's open boards — and only theirs.
    socket.on('join:dashboard', () => {
      if (me.role !== 'admin' || !me.ownerId) {
        return socket.emit('error:forbidden', { message: 'Admin access required' });
      }
      socket.join(dashboardRoom(me.ownerId));
    });
    socket.on('leave:dashboard', () => {
      if (me.ownerId) socket.leave(dashboardRoom(me.ownerId));
    });

    socket.on('leave:project', ({ projectId } = {}) => {
      if (!projectId) return;
      const room = roomName(projectId);
      if (!userHasOtherSocket(room, me.userId, socket.id)) {
        socket.to(room).emit('user:presence', {
          userId: me.userId,
          name: me.name,
          active: false,
        });
      }
      socket.leave(room);
    });

    // 'disconnecting' fires while room membership is still intact, so we can
    // check whether the user has other open sockets before marking them away.
    socket.on('disconnecting', () => {
      const { projectId } = socket.data || {};
      if (projectId) {
        const room = roomName(projectId);
        if (!userHasOtherSocket(room, me.userId, socket.id)) {
          socket.to(room).emit('user:presence', {
            userId: me.userId,
            name: me.name,
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

// Broadcast to every open dashboard belonging to one agency (Kanban sync).
const emitToDashboard = (ownerId, event, payload) => {
  if (io && ownerId) io.to(dashboardRoom(ownerId)).emit(event, payload);
};

module.exports = { initSocket, getIO, emitToProject, emitToDashboard };
