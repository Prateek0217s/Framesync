// Local storage mode test suite — run with: node test-local-storage.js
// Boots the real app (no DB writes needed for these paths), mints signed
// URLs through utils/localStore, and exercises the media routes end-to-end
// over real HTTP: upload round-trip, Range seeking, expiry, tampering,
// traversal, and content-type binding.
const crypto = require('crypto');
const http = require('http');
const path = require('path');
const fs = require('fs');

process.env.STORAGE_MODE = 'local';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-local-storage';
process.env.LOCAL_STORAGE_DIR = path.join(__dirname, 'storage-test');

const app = require('./server.js'); // Express app (server.js starts listening)

const PORT = process.env.PORT || 5001;
const BASE = `http://localhost:${PORT}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let passed = 0;
let failed = 0;
const check = (name, ok, extra = '') => {
  if (ok) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${extra}`);
  }
};

// Tiny HTTP client (no deps): returns {status, headers, body}
const request = (method, url, { body, headers = {} } = {}) =>
  new Promise((resolve, reject) => {
    const req = http.request(url, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        })
      );
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });

const { getPresignedUploadUrl, getPresignedDownloadUrl, buildKey } = require('./utils/localStore');

(async () => {
  // Wait for the server to be reachable.
  for (let i = 0; i < 50; i++) {
    try {
      await request('GET', `${BASE}/api/health`);
      break;
    } catch {
      await sleep(200);
    }
  }

  const key = buildKey('proxy', '507f1f77bcf86cd799439011', 'test-video.mp4');
  const ct = 'video/mp4';
  const payload = Buffer.alloc(2 * 1024 * 1024, 7); // 2MB of 0x07

  console.log('\n── 1. Upload round-trip ──');
  const upUrl = await getPresignedUploadUrl(key, ct, 300);
  const up = await request('PUT', `${BASE}${upUrl}`, {
    body: payload,
    headers: { 'Content-Type': ct },
  });
  check('PUT returns 200', up.status === 200, `(got ${up.status}: ${up.body})`);
  const onDisk = fs.readFileSync(path.join(process.env.LOCAL_STORAGE_DIR, key));
  check('bytes on disk match payload', onDisk.equals(payload));

  console.log('\n── 2. Download + Range (video seeking) ──');
  const downUrl = await getPresignedDownloadUrl(key, 300);
  const full = await request('GET', `${BASE}${downUrl}`);
  check('full GET returns 200', full.status === 200);
  check('full GET body matches', full.body.equals(payload));
  check('Accept-Ranges advertised', full.headers['accept-ranges'] === 'bytes');
  check('Content-Type is video/mp4', full.headers['content-type'] === 'video/mp4');

  const partial = await request('GET', `${BASE}${downUrl}`, {
    headers: { Range: 'bytes=100-199' },
  });
  check('range GET returns 206', partial.status === 206);
  check('range body is exactly 100 bytes', partial.body.length === 100);
  check('range body slice matches', partial.body.equals(payload.subarray(100, 200)));
  check(
    'Content-Range correct',
    partial.headers['content-range'] === `bytes 100-199/${payload.length}`
  );

  const openEnd = await request('GET', `${BASE}${downUrl}`, {
    headers: { Range: 'bytes=1048570-' },
  });
  check('open-ended range 206', openEnd.status === 206, `(got ${openEnd.status})`);
  check('open-ended length correct', openEnd.body.length === payload.length - 1048570);

  const suffix = await request('GET', `${BASE}${downUrl}`, {
    headers: { Range: 'bytes=-500' },
  });
  check('suffix range 206 + last 500 bytes', suffix.status === 206 && suffix.body.equals(payload.subarray(-500)));

  const badRange = await request('GET', `${BASE}${downUrl}`, {
    headers: { Range: `bytes=${payload.length + 10}-` },
  });
  check('unsatisfiable range returns 416', badRange.status === 416);

  const head = await request('HEAD', `${BASE}${downUrl}`);
  check('HEAD returns 200 with length, no body', head.status === 200 && head.body.length === 0 && Number(head.headers['content-length']) === payload.length);

  console.log('\n── 3. Security ──');
  const expired = await getPresignedUploadUrl(key, ct, -1); // already expired
  const expPut = await request('PUT', `${BASE}${expired}`, {
    body: payload,
    headers: { 'Content-Type': ct },
  });
  check('expired signature rejected (403)', expPut.status === 403);

  const tampered = downUrl.replace(/sig=.{8}/, 'sig=deadbeef');
  const tamRes = await request('GET', `${BASE}${tampered}`);
  check('tampered signature rejected (403)', tamRes.status === 403);

  const noSig = await request('GET', `${BASE}/api/uploads/local/${key}`);
  check('missing signature rejected (403)', noSig.status === 403);

  // Sign a traversal key directly with the secret to prove the route's own
  // defenses hold even against someone who CAN mint signatures.
  const evilKey = 'proxy/../../../etc/passwd';
  const evilSig = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update([evilKey, String(Date.now() + 60000)].join('\n'))
    .digest('hex');
  const evilUrl = `/api/uploads/local/${evilKey}?exp=${Date.now() + 60000}&sig=${evilSig}`;
  const evil = await request('GET', `${BASE}${evilUrl}`);
  check('traversal key rejected (400)', evil.status === 400, `(got ${evil.status})`);

  const wrongCtUrl = await getPresignedUploadUrl(key, ct, 300);
  const wrongCt = await request('PUT', `${BASE}${wrongCtUrl}`, {
    body: payload,
    headers: { 'Content-Type': 'text/html' },
  });
  check('wrong Content-Type on PUT rejected (403)', wrongCt.status === 403);

  const missing = await request('GET', `${BASE}${(await getPresignedDownloadUrl('proxy/507f1f77bcf86cd799439011/nope.mp4', 300))}`);
  check('nonexistent object returns 404', missing.status === 404);

  console.log(`\n═══ ${passed} passed, ${failed} failed ═══`);
  fs.rmSync(process.env.LOCAL_STORAGE_DIR, { recursive: true, force: true });
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
