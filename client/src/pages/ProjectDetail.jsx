import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  ShieldCheck,
  Download,
  Loader2,
  Fingerprint,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TopBar from '../components/TopBar';
import VideoReviewer from '../components/VideoReviewer';
import MediaUpload from '../components/MediaUpload';
import ShareLinkModal from '../components/ShareLinkModal';
import useProjectRoom from '../hooks/useProjectRoom';
import { useAuth } from '../context/AuthContext';
import {
  projectsApi,
  commentsApi,
  uploadsApi,
  approvalsApi,
} from '../services/api';
import { STAGES, STAGE_META } from '../lib/constants';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [proxyUrl, setProxyUrl] = useState(null);
  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  const isApproved = project?.status === 'Approved';

  const loadProxy = useCallback(async (proj) => {
    if (!proj?.proxyMediaKey) return setProxyUrl(null);
    try {
      const { url } = await uploadsApi.proxyDownloadUrl(proj._id);
      setProxyUrl(url);
    } catch {
      setProxyUrl(null);
    }
  }, []);

  const loadApproval = useCallback(async (proj) => {
    if (proj?.status !== 'Approved') return;
    try {
      setApproval(await approvalsApi.get(proj._id));
    } catch {
      /* no record yet */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [proj, cs] = await Promise.all([
          projectsApi.get(id),
          commentsApi.listByProject(id),
        ]);
        setProject(proj);
        setComments(cs);
        await Promise.all([loadProxy(proj), loadApproval(proj)]);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, loadProxy, loadApproval]);

  // ---- Real-time (PDD §5.6) ----
  const addComment = useCallback(
    (c) => setComments((prev) => (prev.some((x) => x._id === c._id) ? prev : [...prev, c])),
    []
  );

  const { presence } = useProjectRoom({
    projectId: id,
    user: user ? { userId: user._id, name: user.name, role: 'admin' } : null,
    onCommentNew: addComment,
    onCommentResolved: ({ commentId, resolved }) =>
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, resolved } : c))
      ),
    onStatusChanged: ({ newStatus }) =>
      setProject((p) => (p ? { ...p, status: newStatus } : p)),
    onApproved: () => {
      setProject((p) => (p ? { ...p, status: 'Approved' } : p));
      loadApproval({ _id: id, status: 'Approved' });
    },
  });

  // ---- Comment actions ----
  const createComment = async (payload) => {
    const doc = await commentsApi.create(payload);
    addComment(doc);
    return doc;
  };
  const resolveComment = async (c) => {
    try {
      const updated = await commentsApi.resolve(c._id, !c.resolved);
      setComments((prev) => prev.map((x) => (x._id === c._id ? updated : x)));
    } catch {
      toast.error('Failed to update');
    }
  };
  const deleteComment = async (c) => {
    if (!window.confirm('Delete this feedback?')) return;
    try {
      await commentsApi.remove(c._id);
      setComments((prev) => prev.filter((x) => x._id !== c._id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const changeStatus = async (newStatus) => {
    const prev = project.status;
    setProject((p) => ({ ...p, status: newStatus }));
    try {
      await projectsApi.updateStatus(id, newStatus);
    } catch {
      setProject((p) => ({ ...p, status: prev }));
      toast.error('Failed to change status');
    }
  };

  const onProxyUploaded = async () => {
    const proj = await projectsApi.get(id);
    setProject(proj);
    await loadProxy(proj);
  };
  const onMasterUploaded = async () => {
    const proj = await projectsApi.get(id);
    setProject(proj);
  };

  const downloadMaster = async () => {
    try {
      const { url } = await uploadsApi.masterDownloadUrl(id);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Master locked');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <div className="grid place-items-center py-32 text-slate-500">
          <Loader2 className="animate-spin" />
        </div>
      </div>
    );
  }
  if (!project) return null;

  const clientName =
    typeof project.clientId === 'object' ? project.clientId?.clientName : null;
  const meta = STAGE_META[project.status];

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-[1400px] px-5 py-6">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              to="/"
              className="mb-1 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft size={15} /> Board
            </Link>
            <h1 className="truncate text-2xl font-bold text-slate-100">{project.title}</h1>
            {clientName && <p className="text-sm text-slate-400">{clientName}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`fs-badge ${meta.badge}`}>
              {meta.label}
            </span>
            <select
              value={project.status}
              onChange={(e) => changeStatus(e.target.value)}
              className="fs-input w-auto py-2 text-sm"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button onClick={() => setShowShare(true)} className="fs-btn-primary">
              <Share2 size={16} /> Share for review
            </button>
          </div>
        </div>

        {/* Reviewer */}
        <VideoReviewer
          project={project}
          proxyUrl={proxyUrl}
          role="admin"
          currentUser={{ name: user?.name }}
          comments={comments}
          presence={presence}
          onCreateComment={createComment}
          onResolve={resolveComment}
          onDelete={deleteComment}
        />

        {/* Media & delivery */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="fs-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-100">Proxy media</h3>
            <MediaUpload project={project} variant="proxy" onDone={onProxyUploaded} />
          </div>

          <div className="fs-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Master delivery</h3>
              {isApproved && <ShieldCheck size={16} className="text-emerald-400" />}
            </div>
            <MediaUpload
              project={project}
              variant="master"
              disabled={!isApproved}
              onDone={onMasterUploaded}
            />
            {isApproved && project.masterMediaKey && (
              <button onClick={downloadMaster} className="fs-btn-ghost mt-3 w-full text-sm">
                <Download size={15} /> Download master (15-min link)
              </button>
            )}
          </div>

          <div className="fs-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-100">Approval audit</h3>
            {approval ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Fingerprint size={15} />
                  <span className="font-medium">
                    Signed: “{approval.digitalSig}”
                  </span>
                </div>
                <p className="text-slate-400">
                  {approval.approvedBy?.name || 'Client'} ·{' '}
                  {new Date(approval.approvedAt).toLocaleString()}
                </p>
                <p className="break-all text-xs text-slate-600">
                  IP {approval.ipAddress}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Awaiting client sign-off. The master stays locked until then.
              </p>
            )}
          </div>
        </div>
      </main>

      <ShareLinkModal open={showShare} onClose={() => setShowShare(false)} project={project} />
    </div>
  );
}
