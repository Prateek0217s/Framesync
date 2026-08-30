import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from './Modal';
import { clientsApi } from '../services/api';

export default function NewClientModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    clientName: '',
    contactEmail: '',
    industryType: '',
    logoUrl: '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form };
      if (!payload.industryType) delete payload.industryType;
      if (!payload.logoUrl) delete payload.logoUrl;
      const client = await clientsApi.create(payload);
      toast.success('Client created');
      onCreated?.(client);
      setForm({ clientName: '', contactEmail: '', industryType: '', logoUrl: '' });
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create client');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New client">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="fs-label">Client / Brand name</label>
          <input required value={form.clientName} onChange={set('clientName')} className="fs-input" placeholder="Azure Resorts" />
        </div>
        <div>
          <label className="fs-label">Contact email</label>
          <input required type="email" value={form.contactEmail} onChange={set('contactEmail')} className="fs-input" placeholder="sophia@azureresorts.com" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="fs-label">Industry</label>
            <input value={form.industryType} onChange={set('industryType')} className="fs-input" placeholder="Luxury Hospitality" />
          </div>
          <div>
            <label className="fs-label">Logo URL</label>
            <input value={form.logoUrl} onChange={set('logoUrl')} className="fs-input" placeholder="https://…" />
          </div>
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="fs-btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="fs-btn-primary">
            {busy ? 'Creating…' : 'Create client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
