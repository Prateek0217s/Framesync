import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { projectsApi } from '../services/api';

export default function NewProjectModal({ open, onClose, clients, onCreated, onNeedClient }) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!clientId) return toast.error('Select a client');
    setBusy(true);
    try {
      const project = await projectsApi.create({ title, clientId });
      toast.success('Project created');
      onCreated?.(project);
      setTitle('');
      setClientId('');
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create project');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New project">
      {clients.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-slate-400">
            Create a client first — every project belongs to a brand.
          </p>
          <button type="button" onClick={onNeedClient} className="fs-btn-primary">
            <UserPlus size={16} /> Add a client
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="fs-label">Project title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="fs-input"
              placeholder="Azure Resorts — Summer Campaign"
            />
          </div>
          <div>
            <label className="fs-label">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="fs-input"
              required
            >
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.clientName}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="fs-btn-ghost">Cancel</button>
            <button type="submit" disabled={busy} className="fs-btn-primary">
              {busy ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
