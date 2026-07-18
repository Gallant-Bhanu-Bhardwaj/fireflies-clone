import { useEffect, useMemo, useRef, useState } from "react";

import type { TranscriptSegment } from "../types";
import TranscriptLine from "./TranscriptLine";

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  activeSegmentId: number | null;
  onSeekToSegment: (startTime: number) => void;
  /** Set when arriving from the global search modal's transcript results, to scroll to that line. */
  jumpToSegmentId?: number | null;
}

export default function TranscriptPanel({
  segments,
  activeSegmentId,
  onSeekToSegment,
  jumpToSegmentId = null,
}: TranscriptPanelProps) {
  const [search, setSearch] = useState("");
  const firstMatchRef = useRef<HTMLButtonElement>(null);
  const jumpTargetRef = useRef<HTMLButtonElement>(null);

  // The first segment whose text contains the query — we scroll to it so the
  // user immediately sees a result without hiding any of the other lines.
  const firstMatchId = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return segments.find((s) => s.text.toLowerCase().includes(q))?.id ?? null;
  }, [segments, search]);

  // Scroll the first match into view whenever the query (and thus match) changes.
  useEffect(() => {
    if (firstMatchId !== null && firstMatchRef.current) {
      firstMatchRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [firstMatchId]);

  // Separate from the local search box above: this scrolls to a specific
  // segment requested externally (a global search result), independent of
  // whatever the user has typed into this panel's own search field.
  useEffect(() => {
    if (jumpToSegmentId !== null && jumpTargetRef.current) {
      jumpTargetRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [jumpToSegmentId]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Transcript</h2>
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transcript..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Scrollable list — the panel owns its own scroll so the player and
          header stay pinned while the transcript scrolls. */}
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {segments.map((segment) => {
          let innerRef: typeof firstMatchRef | undefined;
          if (segment.id === firstMatchId) innerRef = firstMatchRef;
          else if (segment.id === jumpToSegmentId) innerRef = jumpTargetRef;

          return (
            <TranscriptLine
              key={segment.id}
              segment={segment}
              isActive={segment.id === activeSegmentId}
              searchQuery={search}
              onClick={() => onSeekToSegment(segment.start_time)}
              innerRef={innerRef}
            />
          );
        })}
      </div>
    </div>
  );
}
