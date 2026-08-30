const mongoose = require('mongoose');

// A single freehand stroke captured on the annotation canvas.
// Points are normalized floats in [0.0, 1.0] so markups are resolution
// independent across viewports (PDD §5.3.3). Kept as a lean subdocument so a
// full markup stays well under the 5 KB budget (PDD §6).
const strokeSchema = new mongoose.Schema(
  {
    color: { type: String, default: '#EF4444' },
    width: { type: Number, default: 4 },
    points: {
      type: [
        {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
          _id: false,
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

// FrameSync Comment model (PDD §7).
const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Please add comment text'],
      trim: true,
    },
    // Video position in seconds (float) the comment is anchored to.
    timestamp: {
      type: Number,
      default: 0,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Denormalized display name so we can render authorship without a populate.
    authorName: {
      type: String,
      required: true,
    },
    // Normalized vector strokes for this frame markup (resolution-independent).
    scribbleData: {
      strokes: { type: [strokeSchema], default: [] },
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
