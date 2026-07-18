import { useState } from "react";

import type { ActionItem, Summary } from "../types";
import ActionItemRow from "./ActionItemRow";
import AddActionItemInput from "./AddActionItemInput";

type Tab = "summary" | "action-items" | "topics";

interface MeetingTabsProps {
  summary: Summary | null;
  actionItems: ActionItem[];
  onToggleActionItem: (item: ActionItem) => void;
  onAddActionItem: (text: string) => Promise<void> | void;
  onDeleteActionItem: (item: ActionItem) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "action-items", label: "Action Items" },
  { id: "topics", label: "Key Topics" },
];

/** Right-hand panel: tabbed view over the meeting's summary, tasks, and topics. */
export default function MeetingTabs({
  summary,
  actionItems,
  onToggleActionItem,
  onAddActionItem,
  onDeleteActionItem,
}: MeetingTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Tab bar */}
      <div className="flex border-b border-slate-100 dark:border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "summary" && (
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {summary?.overview_text ?? "No summary available for this meeting."}
          </p>
        )}

        {activeTab === "action-items" && (
          <>
            <AddActionItemInput onAdd={onAddActionItem} />

            {actionItems.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No action items.</p>
            ) : (
              <ul className="space-y-2">
                {actionItems.map((item) => (
                  <ActionItemRow
                    key={item.id}
                    item={item}
                    onToggle={onToggleActionItem}
                    onDelete={onDeleteActionItem}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {activeTab === "topics" && (
          <>
            {summary && summary.key_topics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {summary.key_topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No key topics.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
