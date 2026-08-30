const mongoose = require('mongoose');

// FrameSync Approval model (PDD §5.5.2 / §7) — an immutable legal sign-off
// record. One approval per project. Once written it must never be mutated;
// re-approval attempts are rejected at the controller layer.
const approvalSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true, // one immutable approval per project
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    digitalSig: {
      type: String,
      required: [true, 'A typed digital signature is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

// Guard against mutation of a sealed approval audit record.
approvalSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('Approval records are immutable and cannot be modified.'));
});

module.exports = mongoose.model('Approval', approvalSchema);
