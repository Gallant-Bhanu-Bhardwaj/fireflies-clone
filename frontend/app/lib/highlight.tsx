/** Escape a user string so it's safe to build a RegExp from. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wrap occurrences of `query` in the text with a yellow <mark>. Non-matching
 * text is left as-is (callers highlight matches rather than hiding others).
 */
export function highlightMatches(text: string, query: string) {
  if (!query.trim()) return text;

  // Capturing group keeps the delimiters so we can re-emit the matched text.
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={i}
        className="rounded bg-yellow-200 px-0.5 text-slate-900 dark:bg-yellow-500/40 dark:text-yellow-50"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}
