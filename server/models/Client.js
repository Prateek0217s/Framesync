const mongoose = require('mongoose');

// FrameSync Client model (PDD §7) — a brand/agency customer.
// Magic-link tokens no longer live here; they are project-scoped ReviewLink docs.
const clientSchema = new mongoose.Schema(
  {
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

module.exports = mongoose.model('Client', clientSchema);
