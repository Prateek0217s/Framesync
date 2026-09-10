import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, LayoutGrid, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import TopBar from '../components/TopBar';
import KanbanBoard from '../components/kanban/KanbanBoard';
import NewProjectModal from '../components/NewProjectModal';
import NewClientModal from '../components/NewClientModal';
import { projectsApi, clientsApi } from '../services/api';
import { STAGES, STAGE_META } from '../lib/constants';
import { joinDashboard, leaveDashboard, on } from '../services/socket';

export default function AgencyDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProject, setShowProject] = useState(false);
  const [showClient, setShowClient] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, c] = await Promise.all([projectsApi.list(), clientsApi.list()]);
        setProjects(p);
        setClients(c);
      } catch {
        toast.error('Failed to load workspace');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Real-time board sync across all agency sessions (PDD §5.4.3).
  useEffect(() => {
    joinDashboard();
    const applyStatus = ({ projectId, newStatus }) =>
      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? { ...p, status: newStatus } : p))
      );
    const offs = [
      on('project:statusChanged', applyStatus),
      on('project:approved', ({ projectId }) => applyStatus({ projectId, newStatus: 'Approved' })),
    ];
    return () => {
      offs.forEach((off) => off());
      leaveDashboard();
    };
  }, []);

  const handleStatusChange = async (projectId, newStatus) => {
    const prev = projects;
    const target = projects.find((p) => p._id === projectId);
    if (!target) return;
    const previousStatus = target.status;
    // Optimistic update (PDD §5.4.2).
    setProjects((list) =>
      list.map((p) => (p._id === projectId ? { ...p, status: newStatus } : p))
    );
    try {
      await projectsApi.updateStatus(projectId, newStatus);
    } catch (err) {
      setProjects(prev); // revert
      toast.error(
        err?.response?.data?.message || `Could not move to ${newStatus}`
      );
      return;
    }
    if (previousStatus !== 'Approved' && newStatus === 'Approved') {
      toast.success('Project approved — master delivery unlocked');
    }
  };

  const counts = STAGES.reduce((acc, s) => {
    acc[s] = projects.filter((p) => p.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-[1400px] px-5 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-400">
              <LayoutGrid size={18} />
              <span className="text-sm">Workspace</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-100">Review Board</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowClient(true)} className="fs-btn-ghost">
              <UserPlus size={16} /> New client
            </button>
            <button onClick={() => setShowProject(true)} className="fs-btn-primary">
              <Plus size={16} /> New project
            </button>
          </div>
        </div>

        {/* Stage summary */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STAGES.map((s) => (
            <div key={s} className="fs-card flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300">{STAGE_META[s].label}</span>
              </div>
              <span className="text-lg font-bold text-slate-100">{counts[s]}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid place-items-center py-24 text-slate-500">
            <Loader2 className="animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="fs-card grid place-items-center gap-3 py-20 text-center">
            <LayoutGrid className="text-slate-700" size={36} />
            <h3 className="text-lg font-semibold text-slate-100">No projects yet</h3>
            <p className="max-w-sm text-sm text-slate-400">
              Create your first project to start the review pipeline.
            </p>
            <button onClick={() => setShowProject(true)} className="fs-btn-primary">
              <Plus size={16} /> New project
            </button>
          </div>
        ) : (
          <KanbanBoard
            projects={projects}
            onOpen={(p) => navigate(`/project/${p._id}`)}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>

      <NewProjectModal
        open={showProject}
        onClose={() => setShowProject(false)}
        clients={clients}
        onCreated={(p) => setProjects((list) => [p, ...list])}
        onNeedClient={() => {
          setShowProject(false);
          setShowClient(true);
        }}
      />
      <NewClientModal
        open={showClient}
        onClose={() => setShowClient(false)}
        onCreated={(c) => setClients((list) => [c, ...list])}
      />
    </div>
  );
}
