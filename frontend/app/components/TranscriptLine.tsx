import type { Ref } from "react";

import { formatTimestamp } from "../lib/format";
import { highlightMatches } from "../lib/highlight";
import type { TranscriptSegment } from "../types";

interface TranscriptLineProps {
  segment: TranscriptSegment;
  isActive: boolean; // currently "playing" segment
  searchQuery: string;
  onClick: () => void;
  innerRef?: Ref<HTMLButtonElement>; // set only on the first search match, to scroll it into view
}

export default function TranscriptLine({
  segment,
  isActive,
  searchQuery,
  onClick,
  innerRef,
}: TranscriptLineProps) {
  return (
    <button
      ref={innerRef}
      type="button"
      onClick={onClick}
      className={`flex w-full gap-3 rounded-lg p-3 text-left transition ${
        isActive
          ? "bg-indigo-50 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:ring-indigo-500/30"
          : "hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}
    >
      {/* Timestamp acts as the seek affordance for this line */}
      <span className="mt-0.5 w-12 shrink-0 text-xs font-medium tabular-nums text-indigo-600 dark:text-indigo-400">
        {formatTimestamp(segment.start_time)}
      </span>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{segment.speaker_name}</p>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {highlightMatches(segment.text, searchQuery)}
        </p>
      </div>
    </button>
  );
}
