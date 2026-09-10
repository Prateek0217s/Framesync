import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import ProjectCard from './ProjectCard';
import Spotlight from '../Spotlight';
import { STAGES } from '../../lib/constants';

/**
 * Drag-and-drop board (PDD §5.4.2). Emits onStatusChange(projectId, newStatus)
 * when a card is dropped into a different column; the parent performs the
 * optimistic update + atomic PATCH.
 */
export default function KanbanBoard({ projects, onOpen, onStatusChange }) {
  const [activeId, setActiveId] = useState(null);

  // A small activation distance lets plain clicks open a card while still
  // enabling drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const byStatus = (status) => projects.filter((p) => p.status === status);
  const activeProject = projects.find((p) => p._id === activeId) || null;

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const newStatus = over.id;
    const proj = projects.find((p) => p._id === active.id);
    if (proj && STAGES.includes(newStatus) && proj.status !== newStatus) {
      onStatusChange(proj._id, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {/* Relative shell so the spotlight bounds cover the board incl. its
          scroll padding (an overlay inside the scroll container itself
          would pan with the columns). */}
      <div className="relative">
        <Spotlight
          size={440}
          className="from-primary/20 via-primary/10 to-transparent blur-3xl"
        />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              projects={byStatus(status)}
              onOpen={onOpen}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeProject ? (
          <div className="w-[260px]">
            <ProjectCard project={activeProject} overlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
