const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { verifySignature, filePath } = require('../utils/localStore');

// Local-disk media endpoints (STORAGE_MODE=local, PDD §10 dev mode).
//
// These routes stand in for S3 itself: the "presigned" URLs minted by
// utils/localStore.js point here, and authentication is the HMAC signature +
// expiry in the query string — NOT a JWT — because the browser's raw upload
// PUT sends no Authorization header (same contract as a real presigned URL).
//
// Mounted at /api/uploads/local/* (see server.js), so everything stays
// same-origin in dev (Vite proxy) and prod (nginx proxy): zero CORS surface.

// Key shape produced by utils/storageKey.js buildKey():
// folder/projectId/<timestamp>-<sanitized-name> — word chars, dots, dashes
// and single separators only. This allowlist (not a ".." blocklist) is the
// path-traversal defense.
const KEY_PATTERN = /^(proxy|master|thumbnail)\/[\w.\-]+\/[\w.\-]+$/;

// Content types for playback/download responses.
const MIME_BY_EXT = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

// Resolve and fully validate a request. Sends the error response itself and
// returns null when the request must not proceed.
const authorize = (req, res) => {
  // req.path keeps its slashes under the mount point (e.g. "proxy/abc/1-x.mp4").
  const key = decodeURIComponent(req.path.replace(/^\//, ''));
  if (!KEY_PATTERN.test(key)) {
    res.status(400).json({ message: 'Invalid object key' });
    return null;
  }
  const { exp, sig, ct } = req.query;
  const contentType = ct || undefined;
  if (!verifySignature({ key, exp, sig, contentType })) {
    res.status(403).json({ message: 'Invalid or expired signature' });
    return null;
  }
  // Defense in depth: the validated key must resolve inside the storage root.
  const resolved = path.resolve(filePath(key));
  const root = path.resolve(
    process.env.LOCAL_STORAGE_DIR || path.join(__dirname, '..', 'storage')
  );
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    res.status(400).json({ message: 'Invalid object key' });
    return null;
  }
  return { key, resolved };
};

// ---- PUT: stream an upload to disk (no buffering — constant memory) ----
router.put('/*', (req, res) => {
  const auth = authorize(req, res);
  if (!auth) return;

  // The signature binds the content type (like a real presigned PUT), so the
  // request header must match the signed value.
  const sentType = (req.headers['content-type'] || '').split(';')[0].trim();
  if (req.query.ct && sentType !== String(req.query.ct)) {
    return res
      .status(403)
      .json({ message: 'Content-Type does not match the signed upload URL' });
  }

  fs.promises
    .mkdir(path.dirname(auth.resolved), { recursive: true })
    .then(() => {
      const stream = fs.createWriteStream(auth.resolved);
      let failed = false;

      const fail = (status, message) => {
        if (failed || res.headersSent) return;
        failed = true;
        stream.destroy();
        // Never leave a partial object behind (S3 semantics: failed PUTs
        // leave nothing readable).
        fs.promises.unlink(auth.resolved).catch(() => {});
        res.status(status).json({ message });
      };

      req.on('error', () => fail(400, 'Upload stream failed'));
      stream.on('error', () => fail(500, 'Could not write the object'));
      stream.on('finish', () => {
        if (!failed) res.status(200).json({ ok: true, key: auth.key });
      });

      req.pipe(stream);
    })
    .catch(() => res.status(500).json({ message: 'Could not create storage path' }));
});

// ---- GET/HEAD: stream from disk with full HTTP Range support ----
// Range is what makes video seeking work — without 206 Partial Content the
// player can't scrub. Implements bytes=start-end, start-, and -suffix.
const streamObject = (req, res, sendBody) => {
  const auth = authorize(req, res);
  if (!auth) return;

  fs.stat(auth.resolved, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      return res.status(404).json({ message: 'Object not found' });
    }

    const type =
      MIME_BY_EXT[path.extname(auth.resolved).toLowerCase()] ||
      'application/octet-stream';

    const rangeHeader = req.headers.range;
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', type);

    // A read error mid-stream must never become an unhandled 'error' event
    // (that would kill the process) — end the response instead.
    const sendRange = (start, end) => {
      const stream = fs.createReadStream(auth.resolved, { start, end });
      stream.on('error', () => res.destroy());
      stream.pipe(res);
    };

    if (!rangeHeader) {
      res.setHeader('Content-Length', stat.size);
      res.writeHead(200);
      if (sendBody) sendRange(0, stat.size - 1);
      else res.end();
      return;
    }

    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (!match || (!match[1] && !match[2])) {
      return res.status(416).json({ message: 'Malformed Range header' });
    }

    let start;
    let end;
    if (!match[1]) {
      // suffix form: bytes=-N → the last N bytes.
      const suffix = Number(match[2]);
      if (suffix === 0) return res.status(416).json({ message: 'Empty range' });
      start = Math.max(0, stat.size - suffix);
      end = stat.size - 1;
    } else {
      start = Number(match[1]);
      end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
    }

    if (start >= stat.size || start > end) {
      // Satisfiable ranges must be reported with the full length (RFC 9110).
      res.setHeader('Content-Range', `bytes */${stat.size}`);
      return res.status(416).json({ message: 'Range not satisfiable' });
    }

    res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.setHeader('Content-Length', end - start + 1);
    res.writeHead(206);
    if (sendBody) sendRange(start, end);
    else res.end();
  });
};

router.get('/*', (req, res) => streamObject(req, res, true));
router.head('/*', (req, res) => streamObject(req, res, false));

module.exports = router;
