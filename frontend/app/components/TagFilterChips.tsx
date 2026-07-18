interface TagFilterChipsProps {
  allTags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

/** Clickable tag pills used to filter the dashboard's meeting grid. */
export default function TagFilterChips({ allTags, selectedTags, onToggle }: TagFilterChipsProps) {
  if (allTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              isSelected
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400"
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
