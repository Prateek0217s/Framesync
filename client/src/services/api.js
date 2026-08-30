import axios from 'axios';
import { getToken, clearSession } from '../lib/session';

// ---- Core REST instance (proxied to the Express API in dev) ----
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      const path = window.location.pathname;
      // Client portals recover by re-verifying their magic link, so leave them
      // in place; only bounce authenticated agency routes to the login screen.
      if (!path.startsWith('/portal') && path !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const data = (p) => p.then((r) => r.data);

// ---- Auth (PDD §8.1 AUTH MODULE) ----
export const authApi = {
  register: (payload) => data(api.post('/auth/register', payload)),
  login: (email, password) => data(api.post('/auth/login', { email, password })),
  me: () => data(api.get('/auth/me')),
  generateMagicLink: (projectId) =>
    data(api.post('/auth/magic-link/generate', { projectId })),
  verifyMagicLink: (token) => data(api.post(`/auth/magic-link/verify/${token}`)),
};

// ---- Clients ----
export const clientsApi = {
  list: () => data(api.get('/clients')),
  create: (payload) => data(api.post('/clients', payload)),
  get: (id) => data(api.get(`/clients/${id}`)),
  remove: (id) => data(api.delete(`/clients/${id}`)),
};

// ---- Projects (PDD §8.1 PROJECTS MODULE) ----
export const projectsApi = {
  list: (params = {}) => data(api.get('/projects', { params })),
  create: (payload) => data(api.post('/projects', payload)),
  get: (id) => data(api.get(`/projects/${id}`)),
  update: (id, payload) => data(api.put(`/projects/${id}`, payload)),
  updateStatus: (id, status) =>
    data(api.patch(`/projects/${id}/status`, { status })),
  remove: (id) => data(api.delete(`/projects/${id}`)),
};

// ---- Comments (PDD §8.1 COMMENTS MODULE) ----
export const commentsApi = {
  listByProject: (projectId) => data(api.get(`/comments/project/${projectId}`)),
  create: (payload) => data(api.post('/comments', payload)),
  resolve: (id, resolved) =>
    data(api.patch(`/comments/${id}/resolve`, { resolved })),
  remove: (id) => data(api.delete(`/comments/${id}`)),
};

// ---- Uploads (PDD §8.1 UPLOADS MODULE + §10 presigned S3) ----
export const uploadsApi = {
  presignProxyUpload: (projectId, filename, contentType) =>
    data(api.post('/uploads/presigned-upload', { projectId, filename, contentType })),
  presignMasterUpload: (projectId, filename, contentType) =>
    data(
      api.post('/uploads/presigned-upload/master', {
        projectId,
        filename,
        contentType,
      })
    ),
  confirmMaster: (projectId, key) =>
    data(api.post('/uploads/master/confirm', { projectId, key })),
  proxyDownloadUrl: (projectId) =>
    data(api.get(`/uploads/presigned-download/proxy/${projectId}`)),
  masterDownloadUrl: (projectId) =>
    data(api.get(`/uploads/presigned-download/master/${projectId}`)),
};

// ---- Approvals (PDD §8.1 APPROVALS MODULE) ----
export const approvalsApi = {
  approve: (projectId, digitalSig) =>
    data(api.post(`/approvals/${projectId}/approve`, { digitalSig })),
  get: (projectId) => data(api.get(`/approvals/${projectId}`)),
};

// ---- Direct-to-S3 PUT (presigned URL; NO auth header — raw S3 endpoint) ----
export async function putToS3(url, blob, contentType, onProgress) {
  await axios.put(url, blob, {
    headers: { 'Content-Type': contentType },
    // Presigned PUT must not carry our Bearer token.
    transformRequest: [(d) => d],
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
}

export default api;
