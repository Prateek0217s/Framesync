const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { buildKey } = require('./storageKey');

// Presigned-URL S3 engine (PDD §5.2.1 / §10). Buckets stay fully private;
// all access is via short-lived presigned URLs, so the API server never
// proxies media bytes (zero egress/compute cost).
//
// Works with AWS S3 or any S3-compatible store (MinIO) by setting S3_ENDPOINT
// and S3_FORCE_PATH_STYLE=true for local development.
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = () => process.env.S3_BUCKET_NAME;

// Presigned PUT for direct browser-to-S3 upload. Default 15-minute TTL,
// bound to the declared content type (PDD §10.1).
const getPresignedUploadUrl = (key, contentType, expiresIn = 900) =>
  getSignedUrl(
    s3Client,
    new PutObjectCommand({ Bucket: BUCKET(), Key: key, ContentType: contentType }),
    { expiresIn }
  );

// Presigned GET for playback/download. Proxy streams get a 1-hour TTL,
// master downloads a tight 15-minute TTL (PDD §10.1).
const getPresignedDownloadUrl = (key, expiresIn = 3600) =>
  getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET(), Key: key }), {
    expiresIn,
  });

const deleteObject = (key) =>
  s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }));

module.exports = {
  s3Client,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  deleteObject,
  buildKey,
};
