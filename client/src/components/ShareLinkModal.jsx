import React, { useEffect, useState } from 'react';
import { Copy, Check, Link2, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { authApi } from '../services/api';

// Generates and displays a project-scoped magic link (PDD §5.1.2/§5.1.3).
export default function ShareLinkModal({ open, onClose, project }) {
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const res = await authApi.generateMagicLink(project._id);
      setLink(res);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setLink(null);
      setCopied(false);
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project?._id]);

  const copy = async () => {
    if (!link?.url) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed — select and copy manually');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share for client review">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-400">
          Send this secure, project-scoped link to your client. It expires in 7 days
          and requires no login.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-900 px-3 py-3 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Generating secure link…
          </div>
        ) : link ? (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-900 px-3 py-2.5">
            <Link2 size={16} className="shrink-0 text-primary-soft" />
            <input
              readOnly
              value={link.url}
              onFocus={(e) => e.target.select()}
              className="flex-1 truncate bg-transparent text-sm text-slate-200 outline-none"
            />
            <button
              type="button"
              onClick={copy}
              className="fs-btn-ghost shrink-0 px-2.5 py-1.5 text-xs"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : null}

        {link?.expiresAt && (
          <p className="text-xs text-slate-500">
            Expires {new Date(link.expiresAt).toLocaleDateString()} ·{' '}
            {new Date(link.expiresAt).toLocaleTimeString()}
          </p>
        )}

        <div className="flex justify-between">
          <button type="button" onClick={generate} disabled={loading} className="fs-btn-ghost text-xs">
            <RefreshCw size={14} /> Regenerate
          </button>
          <button type="button" onClick={onClose} className="fs-btn-primary">Done</button>
        </div>
      </div>
    </Modal>
  );
}
