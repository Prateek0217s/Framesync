const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { sequelize, connectDB } = require('./config/db');
const securityHeaders = require('./middleware/securityHeaders');

// Load env vars
dotenv.config();

// Connect to database and sync models
require('./models'); // Load associations
connectDB().then(() => {
  sequelize.sync({ alter: true }).then(() => {
    console.log('Database synchronized');
  });
});

const app = express();

// Security Headers for SharedArrayBuffer / ffmpeg.wasm
app.use(securityHeaders);

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Route files
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const projectRoutes = require('./routes/projectRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const portalRoutes = require('./routes/portalRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/comments', commentRoutes);

// Error handling for unhandled rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Do not exit the process, let it continue or restart gracefully depending on the environment
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
