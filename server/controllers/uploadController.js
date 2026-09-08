const Project = require('../models/Project');
const {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  buildKey,
} = require('../utils/storage');

// Presigned-URL upload/download engine (PDD §5.2 / §10). The API never touches
// the media bytes in production (S3 mode); in local mode it streams them —
// the backend is chosen by STORAGE_MODE via utils/storage.js.

// POST /api/uploads/presigned-upload  (admin) — proxy media PUT URL (15m).
const presignProxyUpload = async (req, res) => {
  const { projectId, filename, contentType } = req.body;
  const key = buildKey('proxy', projectId, filename);
  const url = await getPresignedUploadUrl(key, contentType, 900);
  res.json({ url, key });
};

// POST /api/uploads/presigned-upload/master  (admin) — LEVEL LOCK:
// only issue a master PUT URL once the project is Approved (PDD §5.5.1/5.5.3).
const presignMasterUpload = async (req, res) => {
  if (req.project.status !== 'Approved') {
    return res
      .status(403)
      .json({ message: 'Master upload is locked until the project is Approved.' });
  }
  const { filename, contentType } = req.body;
  const key = buildKey('master', req.project._id, filename);
  const url = await getPresignedUploadUrl(key, contentType, 900);
  res.json({ url, key });
};

// POST /api/uploads/master/confirm  (admin) — attach the uploaded master key
// (kept out of the general project update so it can't bypass Level Lock).
const confirmMasterKey = async (req, res) => {
  if (req.project.status !== 'Approved') {
    return res.status(403).json({ message: 'Master is locked until the project is Approved.' });
  }
  const { key } = req.body;
  if (!key) return res.status(400).json({ message: 'key is required' });
  req.project.masterMediaKey = key;
  await req.project.save();
  res.json(req.project);
};

// GET /api/uploads/presigned-download/proxy/:projectId — proxy stream URL (1h).
const presignProxyDownload = async (req, res) => {
  if (!req.project.proxyMediaKey) {
    return res.status(404).json({ message: 'No proxy media uploaded yet.' });
  }
  const url = await getPresignedDownloadUrl(req.project.proxyMediaKey, 3600);
  res.json({ url });
};

// GET /api/uploads/presigned-download/master/:projectId — LEVEL LOCK master
// download URL (15m), only when Approved (PDD §5.5.1 / §10.1).
const presignMasterDownload = async (req, res) => {
  if (req.project.status !== 'Approved') {
    return res.status(403).json({ message: 'Master download is locked until Approved.' });
  }
  if (!req.project.masterMediaKey) {
    return res.status(404).json({ message: 'No master asset available yet.' });
  }
  const url = await getPresignedDownloadUrl(req.project.masterMediaKey, 900);
  res.json({ url });
};

module.exports = {
  presignProxyUpload,
  presignMasterUpload,
  confirmMasterKey,
  presignProxyDownload,
  presignMasterDownload,
};
