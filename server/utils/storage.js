// Storage facade (PDD §10). Controllers import from here — never from
// utils/s3.js directly — so the backend is a one-env-var switch:
//
//   STORAGE_MODE=s3     (default) AWS S3 / MinIO via presigned URLs
//   STORAGE_MODE=local  disk-backed dev mode (utils/localStore.js), media
//                       streamed by routes/localMediaRoutes.js
//
// Both backends implement the same contract: getPresignedUploadUrl,
// getPresignedDownloadUrl, deleteObject, buildKey.

const MODE = (process.env.STORAGE_MODE || 's3').toLowerCase();

const impl =
  MODE === 'local' ? require('./localStore') : require('./s3');

if (MODE !== 's3' && MODE !== 'local') {
  throw new Error(`Unknown STORAGE_MODE "${MODE}" — use "s3" or "local".`);
}

module.exports = {
  mode: MODE,
  getPresignedUploadUrl: impl.getPresignedUploadUrl,
  getPresignedDownloadUrl: impl.getPresignedDownloadUrl,
  deleteObject: impl.deleteObject,
  buildKey: impl.buildKey,
};
