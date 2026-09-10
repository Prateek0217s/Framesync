/**
 * Terminal-style loading animation — a local re-creation of prompt-kit's
 * Loader "terminal" variant: a miniature terminal window (red/yellow/green
 * traffic-light dots in the title bar) with a blinking block cursor.
 * Used as the compression-phase indicator in MediaUpload.
 */
export default function TerminalLoader({ size = 28, className = '' }) {
  const dot = Math.max(2, Math.round(size / 13));
  const cursor = {
    width: Math.max(3, Math.round(size / 11)),
    height: Math.max(8, Math.round(size / 2.8)),
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex shrink-0 flex-col overflow-hidden rounded-[15%] border border-line bg-ink-850 ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="flex items-center gap-[14%] border-b border-line px-[10%] py-[10%]">
        <span
          className="rounded-full bg-red-500"
          style={{ width: dot, height: dot }}
        />
        <span
          className="rounded-full bg-yellow-500"
          style={{ width: dot, height: dot }}
        />
        <span
          className="rounded-full bg-green-500"
          style={{ width: dot, height: dot }}
        />
      </div>
      <div className="flex flex-1 items-center px-[16%]">
        <span
          className="animate-terminal-cursor bg-slate-300"
          style={cursor}
        />
      </div>
    </div>
  );
}
