const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// FrameSync User model (PDD §7).
// Agency staff authenticate with email + bcrypt password (role: 'admin').
// External brand reviewers are provisioned as role: 'client' and are always
// bound to a Client entity via `clientId` (PDD §5.1.4 RBAC).
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      // Client (magic-link) users never set a password, and neither do admins
      // who signed up through Google — only email+password admins need one.
      required: function () {
        return this.role === 'admin' && !this.googleId;
      },
      select: false, // never returned by default queries
    },
    // Google account subject id, set on first successful Google sign-in.
    // Presence also exempts the account from the password requirement above.
    googleId: {
      type: String,
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'client'],
      default: 'admin',
      index: true,
    },
    // Only populated for role: 'client' — scopes the reviewer to one brand.
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Hash the password whenever a plaintext value is assigned to `passwordHash`.
// Controllers assign the raw password to `passwordHash`; this hook seals it
// at 12 rounds (PDD FR-5.1.1) before persistence.
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  // Avoid double-hashing an already-hashed value on re-save.
  if (this.passwordHash.startsWith('$2')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.passwordHash);
};

// Strip sensitive fields from any serialized output.
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
