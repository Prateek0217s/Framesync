import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Loader2,
  ShieldCheck,
  Download,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Brand from '../components/Brand';
import ThemeToggle from '../components/ThemeToggle';
import VideoReviewer from '../components/VideoReviewer';
import ApprovalModal from '../components/ApprovalModal';
import useProjectRoom from '../hooks/useProjectRoom';
import { useAuth } from '../context/AuthContext';
import { projectsApi, commentsApi, uploadsApi } from '../services/api';
import { STAGE_META } from '../lib/constants';

/**
 * Public client review portal, reached via a project-scoped magic link
 * (PDD §5.1.2). No password: the link IS the credential. Provides the review
 * surface, digital sign-off, and the conditional master download that stays
 * locked until the project is Approved (Level Lock, §5.5 / §10.3).
 */
export default function ClientPortal() {
  const { token } = useParams();
  const { loginWithMagicLink } = useAuth();

  const [phase, setPhase] = useState('verifying'); // verifying | ready | invalid
  const [errorMsg, setErrorMsg] = useState('');
  const [me, setMe] = useState(null);
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [proxyUrl, setProxyUrl] = useState(null);
  const [showApprove, setShowApprove] = useState(false);

  // Verify the link → establish the scoped session → hydrate the room.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await loginWithMagicLink(token);
        if (!alive) return;
        setMe(res.user);
        const projectId = res.project._id;
        const [proj, cs] = await Promise.all([
          projectsApi.get(projectId),
          commentsApi.listByProject(projectId),
        ]);
        if (!alive) return;
        setProject(proj);
        setComments(cs);
        if (proj.proxyMediaKey) {
          try {
            const { url } = await uploadsApi.proxyDownloadUrl(projectId);
            if (alive) setProxyUrl(url);
          } catch {
            /* proxy link optional */
          }
        }
        setPhase('ready');
      } catch (err) {
        if (!alive) return;
        setErrorMsg(
          err?.response?.data?.message ||
            'This review link is invalid or has expired.'
        );
        setPhase('invalid');
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, loginWithMagicLink]);

  const projectId = project?._id || null;
  const isApproved = project?.status === 'Approved';

  // ---- Real-time (PDD §5.6) ----
  const addComment = useCallback(
    (c) => setComments((prev) => (prev.some((x) => x._id === c._id) ? prev : [...prev, c])),
    []
  );

  const { presence } = useProjectRoom({
    projectId,
    onCommentNew: addComment,
    onCommentResolved: ({ commentId, resolved }) =>
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, resolved } : c))
      ),
    onStatusChanged: ({ newStatus }) =>
      setProject((p) => (p ? { ...p, status: newStatus } : p)),
    onApproved: () => setProject((p) => (p ? { ...p, status: 'Approved' } : p)),
  });

  const createComment = async (payload) => {
    const doc = await commentsApi.create(payload);
    addComment(doc);
    return doc;
  };

  const downloadMaster = async () => {
    try {
      const { url } = await uploadsApi.masterDownloadUrl(projectId);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'The master is not available yet.');
    }
  };

  // ---- Non-ready states ----
  // Both sit on the global Light Ripple backdrop (App.jsx), which shows
  // through in the dark theme.
  if (phase === 'verifying') {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Brand size="lg" />
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Loader2 size={16} className="animate-spin" /> Verifying your review link…
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="fs-card flex max-w-md flex-col items-center gap-3 p-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-400">
            <AlertTriangle size={22} />
          </div>
          <h1 className="text-lg font-semibold text-slate-100">Link unavailable</h1>
          <p className="text-sm text-slate-400">{errorMsg}</p>
          <p className="text-xs text-slate-600">
            Please ask the studio to send you a fresh review link.
          </p>
        </div>
      </div>
    );
  }

  const meta = STAGE_META[project.status];
  const masterReady = isApproved && project.masterMediaKey;

  return (
    <div className="min-h-screen">
      {/* Slim client header */}
      <header className="sticky top-0 z-30 border-b border-line/10 bg-ink-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Brand size="sm" />
            <span className="hidden text-sm text-slate-500 sm:inline">
              Client review
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`fs-badge ${meta.badge}`}>
              {meta.label}
            </span>
            {me?.name && (
              <span className="hidden text-sm text-slate-400 sm:inline">{me.name}</span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-6">
        {/* Title + delivery action */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-100">{project.title}</h1>
            {project.clientId?.clientName && (
              <p className="text-sm text-slate-400">{project.clientId.clientName}</p>
            )}
          </div>

          {isApproved ? (
            masterReady ? (
              <button onClick={downloadMaster} className="fs-btn-primary">
                <Download size={16} /> Download final master
              </button>
            ) : (
              <span className="fs-badge bg-emerald-500/15 text-emerald-300">
                <CheckCircle2 size={14} /> Approved — master in delivery
              </span>
            )
          ) : (
            <button onClick={() => setShowApprove(true)} className="fs-btn-primary">
              <ShieldCheck size={16} /> Approve final cut
            </button>
          )}
        </div>

        {/* Level Lock banner */}
        {!isApproved && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-ink-850/70 px-4 py-3 text-sm text-slate-400">
            <Lock size={16} className="shrink-0 text-slate-500" />
            <span>
              The high-resolution master unlocks automatically once you approve the
              cut. Until then, review the proxy and leave frame-accurate feedback below.
            </span>
          </div>
        )}

        <VideoReviewer
          project={project}
          proxyUrl={proxyUrl}
          role="client"
          currentUser={{ name: me?.name }}
          comments={comments}
          presence={presence}
          onCreateComment={createComment}
        />
      </main>

      <ApprovalModal
        open={showApprove}
        onClose={() => setShowApprove(false)}
        project={project}
        onApproved={() => setProject((p) => ({ ...p, status: 'Approved' }))}
      />
    </div>
  );
}
