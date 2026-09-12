const mongoose = require('mongoose');

// FrameSync Client model (PDD §7) — a brand/agency customer.
// Magic-link tokens no longer live here; they are project-scoped ReviewLink docs.
const clientSchema = new mongoose.Schema(
  {
    // Owning agency account — the tenant boundary for this brand.
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    clientName: {
      type: String,
      required: [true, 'Please add a client name'],
      trim: true,
    },
    industryType: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'Please add a contact email'],
      lowercase: true,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

clientSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model('Client', clientSchema);
