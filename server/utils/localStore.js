const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { buildKey } = require('./storageKey');

// Local-disk storage backend (STORAGE_MODE=local, PDD §10 dev mode).
//
// Implements the same contract as utils/s3.js — presigned-style upload/download
// URLs + object deletion — but backed by a folder on disk (default:
// server/storage/, which sits on the machine's SSD; override with
// LOCAL_STORAGE_DIR). Media bytes STREAM through the API server in this mode,
// which is fine for local testing but is why S3 remains the production path.
//
// "Presigned" here means an HMAC-SHA256 signature over the object key and
// expiry (and, for uploads, the bound content type), carried in the query
// string — mirroring how S3 presigned URLs work, because the browser's raw
// PUT (utils putToS3) sends no Authorization header. The routes in
// routes/localMediaRoutes.js verify these signatures.

const STORAGE_ROOT = () =>
  process.env.LOCAL_STORAGE_DIR || path.join(__dirname, '..', 'storage');

const SIGNING_SECRET = () => process.env.JWT_SECRET;

// Absolute path for a validated key. Callers must have validated the key
// shape first (see localMediaRoutes) — defense in depth lives there.
const filePath = (key) => path.join(STORAGE_ROOT(), key);

// HMAC-SHA256 over the message parts, hex-encoded.
const sign = (parts) =>
  crypto.createHmac('sha256', SIGNING_SECRET()).update(parts.join('\n')).digest('hex');

// Constant-time equality that tolerates differing lengths.
const safeEqual = (a, b) => {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};

// Verify exp+sig for a key (and optionally a bound content type). Returns
// true iff nothing expired, nothing was tampered with, and every expected
// part matches exactly.
const verifySignature = ({ key, exp, sig, contentType }) => {
  const expiryMs = Number(exp);
  if (!expiryMs || !Number.isFinite(expiryMs)) return false;
  if (Date.now() > expiryMs) return false;
  const expected = contentType
    ? sign([key, String(expiryMs), contentType])
    : sign([key, String(expiryMs)]);
  return safeEqual(sig, expected);
};

// Build a relative, signed URL. Relative on purpose: same-origin in dev
// (Vite proxies /api) and in prod (nginx proxies /api), so axios.put,
// <video src>, and window.open all work with zero CORS surface.
const signedUrl = (key, expiresIn, contentType) => {
  const exp = Date.now() + expiresIn * 1000;
  const sig = contentType
    ? sign([key, String(exp), contentType])
    : sign([key, String(exp)]);
  const qs = new URLSearchParams({ exp: String(exp), sig });
  if (contentType) qs.set('ct', contentType);
  return `/api/uploads/local/${key}?${qs.toString()}`;
};

// ---- s3.js-compatible contract ----

// "Presigned" PUT URL (default 15-minute TTL), content-type bound like the
// real thing (PDD §10.1).
const getPresignedUploadUrl = (key, contentType, expiresIn = 900) =>
  Promise.resolve(signedUrl(key, expiresIn, contentType));

// "Presigned" GET URL. Proxy streams get a 1-hour TTL, master downloads a
// tight 15-minute TTL (PDD §10.1) — the controller decides.
const getPresignedDownloadUrl = (key, expiresIn = 3600) =>
  Promise.resolve(signedUrl(key, expiresIn));

// Delete an object. Missing files resolve (S3 semantics) so project cleanup
// never fails on a storage hiccup.
const deleteObject = async (key) => {
  try {
    await fs.promises.unlink(filePath(key));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
};

module.exports = {
  buildKey,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  deleteObject,
  verifySignature,
  filePath,
};
