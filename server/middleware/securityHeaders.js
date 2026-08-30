// Baseline security headers.
//
// NOTE (PDD §6 / §11): FrameSync deliberately uses the *single-threaded*
// @ffmpeg/core, which does NOT require SharedArrayBuffer. We therefore do
// NOT set Cross-Origin-Embedder-Policy: require-corp — doing so would break
// presigned S3 media and Google Fonts (cross-origin). Keeping isolation off is
// the intended architecture.
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  next();
};

module.exports = securityHeaders;
