import Link from "next/link";

import { formatDuration, formatMeetingDate } from "../lib/format";
import type { Meeting } from "../types";
import AvatarStack from "./AvatarStack";

export default function MeetingCard({ meeting }: { meeting: Meeting }) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="group flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/40"
    >
      <div>
        <h3 className="line-clamp-1 font-semibold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
          {meeting.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatMeetingDate(meeting.date)}</p>
      </div>

      {meeting.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {meeting.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <AvatarStack participants={meeting.participants} />

        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            className="h-4 w-4"
          >
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
          </svg>
          {formatDuration(meeting.duration_seconds)}
        </div>
      </div>
    </Link>
  );
}
