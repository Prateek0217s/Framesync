const mongoose = require('mongoose');

// FrameSync Project model (PDD §7).
// Media are stored as S3 object *keys* (not public URLs); the client fetches
// short-lived presigned URLs on demand. masterMediaKey stays gated until the
// project reaches 'Approved' (Level Lock, PDD §5.5).
const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a project title'],
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['Pre-Production', 'Rough Cut', 'Client Review', 'Approved'],
      default: 'Pre-Production',
      index: true,
    },
    proxyMediaKey: { type: String, default: null },
    masterMediaKey: { type: String, default: null },
    thumbnailKey: { type: String, default: null },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
