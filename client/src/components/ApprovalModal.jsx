import React, { useState } from 'react';
import { ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { approvalsApi } from '../services/api';

// Client sign-off: a typed signature (2–160 chars) creates an immutable
// Approval record and flips the project to Approved, unlocking the master
// download (PDD §5.5 / §10.3).
export default function ApprovalModal({ open, onClose, project, onApproved }) {
  const [sig, setSig] = useState('');
  const [busy, setBusy] = useState(false);

  const trimmed = sig.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= 160;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      const approval = await approvalsApi.approve(project._id, trimmed);
      toast.success('Approved — final master unlocked');
      onApproved?.(approval);
      setSig('');
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Approval failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Approve final cut">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-sm text-amber-200/90">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <p>
            Approving is final. It locks the current cut as the accepted version and
            releases the high-resolution master for delivery. This action is recorded.
          </p>
        </div>

        <div>
          <label className="fs-label">Type your full name to sign</label>
          <input
            autoFocus
            value={sig}
            onChange={(e) => setSig(e.target.value)}
            className="fs-input font-medium"
            placeholder="e.g. Sophia Laurent"
            maxLength={160}
          />
          <p className="mt-1 text-xs text-slate-500">
            Your typed name is your digital signature for “{project?.title}”.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="fs-btn-ghost">
            Cancel
          </button>
          <button type="submit" disabled={!valid || busy} className="fs-btn-primary">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {busy ? 'Signing…' : 'Approve & sign'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
