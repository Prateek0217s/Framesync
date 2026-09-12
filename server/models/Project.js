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
    // Owning agency account. Denormalized from the parent Client so the board
    // query and authorizeProjectAccess both work off this document alone —
    // no join, no second lookup. Kept in sync wherever clientId is set.
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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

// Board list: my projects, newest first. Status filter rides the same index.
projectSchema.index({ ownerId: 1, createdAt: -1 });
projectSchema.index({ ownerId: 1, status: 1 });

module.exports = mongoose.model('Project', projectSchema);
