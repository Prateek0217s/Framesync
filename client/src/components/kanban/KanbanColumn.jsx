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
          <h3 className={`text-sm font-semibold ${meta.text}`}>{meta.label}</h3>
        </div>
        <span className="rounded-full bg-ink-800 px-2 py-0.5 text-xs text-slate-400">
          {projects.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        style={{ perspective: '800px' }}
        className={`flex min-h-[140px] flex-1 flex-col gap-2 rounded-xl border p-2 transition ${
          isOver
            ? 'border-primary bg-primary/5'
            : 'border-line bg-ink-900/40'
        }`}
      >
        {projects.map((p, i) => (
          <div
            key={p._id}
            // Stack entrance (motion-primitives AnimatedGroup variant): when
            // two or more cards are stacked, each drops in blurred and
            // edge-on, spring-settling with a 50ms stagger — like the demo,
            // minus the framer-motion dependency. Only runs when the node
            // mounts (initial load / a card joining the stack); reordering
            // doesn't re-trigger it. Keyed by _id so React keeps existing
            // nodes. motion-reduce: skip entirely.
            className={projects.length > 1 ? 'animate-stack-in motion-reduce:animate-none' : ''}
            style={projects.length > 1 ? { animationDelay: `${i * 0.05}s` } : undefined}
          >
            <ProjectCard project={p} onOpen={onOpen} />
          </div>
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
