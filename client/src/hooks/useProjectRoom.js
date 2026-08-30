import { useEffect, useRef, useState } from 'react';
import { joinProject, leaveProject, on } from '../services/socket';

// Joins the project war-room (PDD §5.6) and wires real-time events to the
// caller's handlers. Tracks live presence internally and returns the roster.
export default function useProjectRoom({
  projectId,
  user,
  onCommentNew,
  onCommentResolved,
  onStatusChanged,
  onApproved,
}) {
  const [presence, setPresence] = useState([]);

  // Keep the latest handlers without forcing the socket effect to re-run.
  const handlers = useRef({});
  handlers.current = {
    onCommentNew,
    onCommentResolved,
    onStatusChanged,
    onApproved,
  };

  useEffect(() => {
    if (!projectId) return undefined;

    joinProject(projectId, {
      userId: user?.userId || user?.id || user?._id,
      name: user?.name || 'Guest',
      role: user?.role,
    });

    const offs = [
      on('user:presence', ({ userId, name, active }) => {
        setPresence((prev) => {
          const others = prev.filter((p) => p.userId !== userId);
          return active ? [...others, { userId, name }] : others;
        });
      }),
      on('comment:new', (c) => handlers.current.onCommentNew?.(c)),
      on('comment:resolved', (p) => handlers.current.onCommentResolved?.(p)),
      on('project:statusChanged', (p) => handlers.current.onStatusChanged?.(p)),
      on('project:approved', (p) => handlers.current.onApproved?.(p)),
    ];

    return () => {
      offs.forEach((off) => off());
      leaveProject();
      setPresence([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return { presence };
}
