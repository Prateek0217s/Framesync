// Kanban pipeline stages (PDD §5.4.1) — order defines the board columns.
export const STAGES = [
  'Pre-Production',
  'Rough Cut',
  'Client Review',
  'Approved',
];

export const STAGE_META = {
  'Pre-Production': {
    label: 'Pre-Production',
    dot: 'bg-stage-pre',
    text: 'text-slate-300',
    ring: 'ring-stage-pre/40',
    badge: 'bg-slate-500/15 text-slate-300',
  },
  'Rough Cut': {
    label: 'Rough Cut',
    dot: 'bg-stage-rough',
    text: 'text-amber-300',
    ring: 'ring-stage-rough/40',
    badge: 'bg-amber-500/15 text-amber-300',
  },
  'Client Review': {
    label: 'Client Review',
    dot: 'bg-stage-review',
    text: 'text-blue-300',
    ring: 'ring-stage-review/40',
    badge: 'bg-blue-500/15 text-blue-300',
  },
  Approved: {
    label: 'Approved',
    dot: 'bg-stage-approved',
    text: 'text-emerald-300',
    ring: 'ring-stage-approved/40',
    badge: 'bg-emerald-500/15 text-emerald-300',
  },
};

// Annotation toolbar (PDD §5.3.4): 5 preset colors, 3 stroke widths.
export const STROKE_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // green
  '#22D3EE', // cyan
  '#FFFFFF', // white
];

export const STROKE_WIDTHS = [3, 6, 10];

// Media ingestion (PDD §5.2.1): files below this go straight to S3.
export const COMPRESSION_THRESHOLD_BYTES = 100 * 1024 * 1024; // 100 MB
