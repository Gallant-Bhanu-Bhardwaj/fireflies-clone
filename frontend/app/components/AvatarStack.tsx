import type { Participant } from "../types";
import { getAvatarColor, getInitials } from "../lib/format";

const MAX_VISIBLE = 4;

/** Overlapping row of participant initials, Fireflies-card style. */
export default function AvatarStack({ participants }: { participants: Participant[] }) {
  if (participants.length === 0) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">No participants</span>;
  }

  const visible = participants.slice(0, MAX_VISIBLE);
  const overflow = participants.length - visible.length;

  return (
    <div className="flex items-center">
      {visible.map((p, i) => (
        <div
          key={p.id}
          title={p.name}
          style={{ zIndex: visible.length - i }}
          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[11px] font-medium text-white dark:border-slate-900 ${getAvatarColor(
            p.id
          )} ${i > 0 ? "-ml-2" : ""}`}
        >
          {getInitials(p.name)}
        </div>
      ))}
      {overflow > 0 && (
        <div className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[11px] font-medium text-slate-600 dark:border-slate-900 dark:bg-slate-700 dark:text-slate-300">
          +{overflow}
        </div>
      )}
    </div>
  );
}
