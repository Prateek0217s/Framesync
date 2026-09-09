import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { STAGE_META } from '../../lib/constants';
import ProjectCard from './ProjectCard';

export default function KanbanColumn({ status, projects, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STAGE_META[status];

  return (
    <div className="flex min-w-[260px] flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
          <h3 className={`text-sm font-semibold ${meta.text}`}>{meta.label}</h3>
        </div>
        <span className="rounded-full bg-ink-800 px-2 py-0.5 text-xs text-slate-400">
          {projects.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[140px] flex-1 flex-col gap-2 rounded-xl border p-2 transition ${
          isOver
            ? 'border-primary bg-primary/5'
            : 'border-line bg-ink-900/40'
        }`}
      >
        {projects.map((p) => (
          <ProjectCard key={p._id} project={p} onOpen={onOpen} />
        ))}
        {projects.length === 0 && (
          <div className="grid flex-1 place-items-center rounded-lg text-center text-xs text-slate-600">
            Drop projects here
          </div>
        )}
      </div>
    </div>
  );
}
