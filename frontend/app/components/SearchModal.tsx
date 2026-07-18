"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { searchMeetings } from "../lib/api";
import { formatTimestamp } from "../lib/format";
import { highlightMatches } from "../lib/highlight";
import type { SearchResult } from "../types";
import Modal from "./Modal";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEBOUNCE_MS = 250;

/** Command-palette-style global search across meeting titles and transcript text. */
export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced live search: wait for a pause in typing before hitting the API.
  // All state updates happen inside the timeout/promise callbacks (never
  // synchronously in the effect body) so a stale, in-flight request can't
  // clobber a newer one after the query changes again.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      searchMeetings(trimmed)
        .then((data) => {
          if (!cancelled) setResults(data);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  function handleClose() {
    setQuery("");
    setResults([]);
    onClose();
  }

  function goToMeeting(meetingId: number) {
    router.push(`/meetings/${meetingId}`);
    handleClose();
  }

  function goToSegment(meetingId: number, segmentId: number) {
    router.push(`/meetings/${meetingId}?segment=${segmentId}`);
    handleClose();
  }

  const trimmedQuery = query.trim();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Search">
      <input
        type="text"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search meeting titles and transcripts..."
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
      />

      <div className="mt-4 max-h-96 space-y-4 overflow-y-auto">
        {trimmedQuery && isSearching && (
          <p className="text-sm text-slate-400">Searching...</p>
        )}

        {trimmedQuery && !isSearching && results.length === 0 && (
          <p className="text-sm text-slate-400">No matches for &ldquo;{trimmedQuery}&rdquo;</p>
        )}

        {trimmedQuery &&
          !isSearching &&
          results.map((result) => (
            <div key={result.meeting_id}>
              <button
                type="button"
                onClick={() => goToMeeting(result.meeting_id)}
                className="w-full rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {result.title_match
                  ? highlightMatches(result.meeting_title, trimmedQuery)
                  : result.meeting_title}
              </button>

              {result.segment_matches.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {result.segment_matches.map((segment) => (
                    <li key={segment.id}>
                      <button
                        type="button"
                        onClick={() => goToSegment(result.meeting_id, segment.id)}
                        className="flex w-full gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span className="mt-0.5 shrink-0 text-xs font-medium tabular-nums text-indigo-600 dark:text-indigo-400">
                          {formatTimestamp(segment.start_time)}
                        </span>
                        <span className="min-w-0 text-slate-600 dark:text-slate-300">
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {segment.speaker_name}:
                          </span>{" "}
                          {highlightMatches(segment.text, trimmedQuery)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </div>
    </Modal>
  );
}
