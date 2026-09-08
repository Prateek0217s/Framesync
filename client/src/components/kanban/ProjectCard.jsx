import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MessageSquare, GripVertical, Film } from 'lucide-react';
import { STAGE_META } from '../../lib/constants';
import { timeAgo } from '../../lib/time';

export default function ProjectCard({ project, onOpen, overlay = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project._id,
    data: { status: project.status },
    disabled: overlay,
  });

  const meta = STAGE_META[project.status] || STAGE_META['Pre-Production'];
  const clientName =
    typeof project.clientId === 'object' ? project.clientId?.clientName : null;

  const style = overlay
    ? undefined
    : { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group fs-card p-3 ${overlay ? 'rotate-2 shadow-glow' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-slate-600 hover:text-slate-400 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag"
        >
          <GripVertical size={16} />
        </button>

        <button
          type="button"
          onClick={() => onOpen?.(project)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="mb-2 flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-ink-950">
            <Film size={22} className="text-slate-700" />
          </div>
          <h4 className="truncate text-sm font-semibold text-slate-100 group-hover:text-slate-100">
            {project.title}
          </h4>
          {clientName && (
            <p className="truncate text-xs text-slate-500">{clientName}</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className={`fs-badge ${meta.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              v{project.version || 1}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              {typeof project.commentCount === 'number' && (
                <>
                  <MessageSquare size={12} /> {project.commentCount}
                </>
              )}
              <span className="ml-1">{timeAgo(project.updatedAt)}</span>
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
