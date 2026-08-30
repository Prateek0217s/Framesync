import React from 'react';
import { Users } from 'lucide-react';

function initials(name = '?') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

// Deterministic avatar tint from the name.
function tint(name = '') {
  const palette = ['#7C3AED', '#22D3EE', '#F59E0B', '#10B981', '#EF4444', '#3B82F6'];
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

// Live collaborators in the room (PDD §5.6.2). `self` is rendered first.
export default function PresenceBar({ presence = [], self }) {
  const roster = [];
  if (self) roster.push({ userId: 'self', name: `${self.name || 'You'} (you)` });
  presence.forEach((p) => roster.push(p));

  const count = roster.length;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Users size={14} />
        <span>{count} reviewing</span>
      </div>
      <div className="flex -space-x-2">
        {roster.slice(0, 6).map((p) => (
          <div
            key={p.userId}
            title={p.name}
            className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink-850 text-[11px] font-bold text-white ring-1 ring-black/20"
            style={{ backgroundColor: tint(p.name) }}
          >
            {initials(p.name)}
          </div>
        ))}
        {count > 6 && (
          <div className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink-850 bg-ink-700 text-[11px] font-semibold text-slate-300">
            +{count - 6}
          </div>
        )}
      </div>
    </div>
  );
}
