// Shared object-key builder (PDD §10). Both storage backends (S3 and the
// local disk mode) must produce identical key shapes so a project's media
// keys are backend-agnostic: `folder/projectId/<timestamp>-<safeName>`.

// Build a collision-resistant, path-namespaced object key.
const buildKey = (folder, projectId, originalName) => {
  const safe = String(originalName || 'file').replace(/[^\w.\-]+/g, '-');
  return `${folder}/${projectId}/${Date.now()}-${safe}`;
};

module.exports = { buildKey };
