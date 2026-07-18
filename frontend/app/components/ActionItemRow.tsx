import type { ActionItem } from "../types";

interface ActionItemRowProps {
  item: ActionItem;
  onToggle: (item: ActionItem) => void;
  onDelete: (item: ActionItem) => void;
}

/** Human-friendly due date, e.g. "Jul 18". */
function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ActionItemRow({ item, onToggle, onDelete }: ActionItemRowProps) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
      {/* Native checkbox keeps keyboard/a11y behavior for free; toggling fires
          the PUT in the parent so state + server stay in sync. */}
      <input
        type="checkbox"
        checked={item.is_completed}
        onChange={() => onToggle(item)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-indigo-600"
      />

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${
            item.is_completed
              ? "text-slate-400 line-through dark:text-slate-500"
              : "text-slate-800 dark:text-slate-200"
          }`}
        >
          {item.text}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {item.assignee && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {item.assignee}
            </span>
          )}
          {item.due_date && <span>Due {formatDueDate(item.due_date)}</span>}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(item)}
        aria-label="Delete action item"
        className="mt-0.5 shrink-0 rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:text-slate-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
        </svg>
      </button>
    </li>
  );
}
