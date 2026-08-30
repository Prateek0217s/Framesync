const mongoose = require('mongoose');

// FrameSync ReviewLink model (PDD §5.1.2-5.1.3 / §7).
// A cryptographically random, project-scoped magic token that lets an external
// reviewer into exactly one project's review room. Expires after 7 days.
const reviewLinkSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Convenience: a link is valid if active, unexpired.
reviewLinkSchema.methods.isValid = function () {
  return this.active && this.expiresAt.getTime() > Date.now();
};

module.exports = mongoose.model('ReviewLink', reviewLinkSchema);
