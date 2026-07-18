"use client";

// Client component: needs useState/useEffect for the live search filter,
// sort dropdown, and the fetch to the FastAPI backend.
import { useCallback, useEffect, useMemo, useState } from "react";

import MeetingCard from "./components/MeetingCard";
import Navbar from "./components/Navbar";
import NewMeetingModal from "./components/NewMeetingModal";
import SearchModal from "./components/SearchModal";
import TagFilterChips from "./components/TagFilterChips";
import { API_BASE_URL } from "./lib/api";
import type { Meeting } from "./types";

type SortOrder = "recent" | "oldest";

export default function Home() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("recent");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/meetings`);
      if (!res.ok) throw new Error("Failed to load meetings");
      setMeetings(await res.json());
      setError(null);
    } catch {
      setError(`Couldn't load meetings. Is the backend running at ${API_BASE_URL}?`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Inlined rather than calling fetchMeetings() by reference — the effect
  // lint rule can't statically confirm an external function only sets state
  // after an await, so it flags the call site as a synchronous setState.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/meetings`);
        if (!res.ok) throw new Error("Failed to load meetings");
        setMeetings(await res.json());
        setError(null);
      } catch {
        setError(`Couldn't load meetings. Is the backend running at ${API_BASE_URL}?`);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // All distinct tags across the fetched meetings, for the filter chip row.
  // Computed from the unfiltered list so chips don't disappear as you filter.
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    meetings.forEach((m) => m.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [meetings]);

  function toggleTagFilter(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  }

  // Filtering/sorting is done client-side against the already-fetched list
  // so the search box can filter as-you-type without round-tripping to the API.
  const visibleMeetings = useMemo(() => {
    const filtered = meetings.filter((m) => {
      const matchesTitle = m.title.toLowerCase().includes(search.toLowerCase());
      // OR semantics: a meeting matches if it has at least one selected tag.
      const matchesTags =
        selectedTags.length === 0 || selectedTags.some((tag) => m.tags.includes(tag));
      return matchesTitle && matchesTags;
    });

    return filtered.sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sort === "recent" ? -diff : diff;
    });
  }, [meetings, search, sort, selectedTags]);

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">My Meetings</h1>

          <button
            type="button"
            onClick={() => setIsNewMeetingOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
            >
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            New Meeting
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
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
              placeholder="Search meetings..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        <div className="mb-6">
          <TagFilterChips allTags={allTags} selectedTags={selectedTags} onToggle={toggleTagFilter} />
        </div>

        {isLoading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading meetings...</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {!isLoading && !error && visibleMeetings.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">No meetings found.</p>
        )}

        {!isLoading && !error && visibleMeetings.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </main>

      <NewMeetingModal
        isOpen={isNewMeetingOpen}
        onClose={() => setIsNewMeetingOpen(false)}
        onCreated={fetchMeetings}
      />

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
