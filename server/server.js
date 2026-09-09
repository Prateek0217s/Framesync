const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const securityHeaders = require('./middleware/securityHeaders');
const { isAllowedOrigin } = require('./utils/originAllowlist');
const { initSocket } = require('./socket');

dotenv.config();
connectDB();

const app = express();

// Trust proxy hops only when explicitly configured (TRUST_PROXY = number of
// hops), so the immutable approval audit IP (PDD §5.5.2) can't be spoofed via
// X-Forwarded-For in deployments that aren't actually behind a proxy.
app.set('trust proxy', Number(process.env.TRUST_PROXY) || false);

app.use(securityHeaders);
app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    // Accept localhost + private-LAN origins (see utils/originAllowlist) so
    // the dashboard works from any device on the same network as the dev box.
    origin: (origin, cb) => cb(null, isAllowedOrigin(origin)),
    credentials: true,
  })
);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', service: 'framesync-api' })
);

// REST modules (PDD §8.1)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/api/approvals', require('./routes/approvalRoutes'));

// Local-disk media endpoints (STORAGE_MODE=local). JWT-less by design —
// these stand in for S3 itself and authenticate via the HMAC signature in
// the query string (see routes/localMediaRoutes.js). Safe to mount in S3
// mode too: no valid signature can be produced without JWT_SECRET.
app.use('/api/uploads/local', require('./routes/localMediaRoutes'));

// 404
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // A malformed ObjectId in a route param is a client error, not a 500.
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier' });
  }
  // Duplicate unique key (e.g. a concurrent second approval) -> conflict.
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Resource already exists' });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: err.message || 'Server Error' });
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection: ${err.message}`);
});

// HTTP + Socket.io share one server (PDD §5.6).
const server = http.createServer(app);
initSocket(server);

// Default matches the committed client dev proxy (client/vite.config.js).
const PORT = process.env.PORT || 5001;
server.listen(PORT, () =>
  console.log(`FrameSync API + Socket.io running on port ${PORT}`)
);
