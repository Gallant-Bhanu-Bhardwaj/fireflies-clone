"use client";

// Client component: the whole detail view is interactive (player state,
// transcript sync, tab switching, action-item toggles), so it renders on the
// client and fetches its data in an effect.
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import ConfirmModal from "../../components/ConfirmModal";
import EditMeetingModal from "../../components/EditMeetingModal";
import MediaPlayer from "../../components/MediaPlayer";
import MeetingTabs from "../../components/MeetingTabs";
import { useToast } from "../../components/ToastProvider";
import TranscriptPanel from "../../components/TranscriptPanel";
import { useTranscriptSync } from "../../hooks/useTranscriptSync";
import { API_BASE_URL } from "../../lib/api";
import { formatDuration, formatMeetingDate } from "../../lib/format";
import type { ActionItem, MeetingDetail } from "../../types";

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const meetingId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Set when arriving from the global search modal's transcript results
  // (?segment=<id>), so the transcript panel scrolls to that exact line.
  const jumpSegmentId = searchParams.get("segment")
    ? Number(searchParams.get("segment"))
    : null;

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  // Action items are held in their own state so a checkbox toggle can update
  // optimistically without re-fetching the whole meeting.
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // GET /meetings/{id} returns transcript, summary, and action items nested,
  // so a single request hydrates the entire page.
  useEffect(() => {
    fetch(`${API_BASE_URL}/meetings/${meetingId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load meeting");
        return res.json();
      })
      .then((data: MeetingDetail) => {
        setMeeting(data);
        setActionItems(data.action_items);
      })
      .catch(() =>
        setError(`Couldn't load this meeting. Is the backend running at ${API_BASE_URL}?`)
      )
      .finally(() => setIsLoading(false));
  }, [meetingId]);

  // Player <-> transcript sync. Called unconditionally (hooks rules); it simply
  // has nothing to track until segments arrive.
  const {
    audioRef,
    currentTime,
    duration,
    isPlaying,
    activeSegmentId,
    seekTo,
    togglePlay,
    setCurrentTime,
  } = useTranscriptSync(meeting?.transcript_segments ?? [], meeting?.duration_seconds ?? 0);

  // Once the meeting (and its segments) load, seek playback to the segment
  // requested via ?segment=<id> so it's highlighted as "active" the same way
  // a currently-playing line would be. Guarded by a ref so it only applies
  // once per distinct param — otherwise it would fight any manual seeking.
  const appliedJumpSegmentRef = useRef<number | null>(null);
  useEffect(() => {
    if (!meeting || jumpSegmentId === null) return;
    if (appliedJumpSegmentRef.current === jumpSegmentId) return;

    const segment = meeting.transcript_segments.find((s) => s.id === jumpSegmentId);
    if (!segment) return;

    appliedJumpSegmentRef.current = jumpSegmentId;
    const clamped = Math.min(Math.max(0, segment.start_time), meeting.duration_seconds);
    setCurrentTime(clamped);
    if (audioRef.current) audioRef.current.currentTime = clamped;
  }, [meeting, jumpSegmentId, setCurrentTime, audioRef]);

  // Toggle completion optimistically, then persist via PUT. Revert on failure
  // so the UI never drifts from the server.
  async function handleToggleActionItem(item: ActionItem) {
    const nextCompleted = !item.is_completed;
    setActionItems((items) =>
      items.map((i) => (i.id === item.id ? { ...i, is_completed: nextCompleted } : i))
    );

    try {
      const res = await fetch(`${API_BASE_URL}/action-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_completed: nextCompleted }),
      });
      if (!res.ok) throw new Error("Update failed");
      showToast(nextCompleted ? "Marked complete" : "Marked incomplete");
    } catch {
      setActionItems((items) =>
        items.map((i) => (i.id === item.id ? { ...i, is_completed: item.is_completed } : i))
      );
      showToast("Couldn't update the action item", "error");
    }
  }

  async function handleAddActionItem(text: string) {
    const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}/action-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, assignee: null, is_completed: false, due_date: null }),
    });
    if (!res.ok) {
      showToast("Couldn't add the action item", "error");
      throw new Error("Create failed");
    }
    const created: ActionItem = await res.json();
    setActionItems((items) => [...items, created]);
    showToast("Action item added");
  }

  // Remove optimistically, then persist via DELETE. Restore on failure.
  async function handleDeleteActionItem(item: ActionItem) {
    setActionItems((items) => items.filter((i) => i.id !== item.id));

    try {
      const res = await fetch(`${API_BASE_URL}/action-items/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Action item deleted");
    } catch {
      setActionItems((items) => [...items, item]);
      showToast("Couldn't delete the action item", "error");
    }
  }

  function handleMeetingUpdated(updated: MeetingDetail) {
    setMeeting(updated);
    setActionItems(updated.action_items);
  }

  async function handleDeleteMeeting() {
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/meetings/${meetingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast("Meeting deleted");
      router.push("/");
    } catch {
      showToast("Couldn't delete the meeting. Please try again.", "error");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <p className="p-8 text-sm text-slate-500 dark:text-slate-400">Loading meeting...</p>;
  }

  if (error || !meeting) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600 dark:text-red-400">{error ?? "Meeting not found."}</p>
        <Link href="/" className="mt-3 inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          ← Back to meetings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header: back button + meeting metadata */}
      <header className="flex items-start justify-between border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
            </svg>
            Back to meetings
          </Link>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{meeting.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {formatMeetingDate(meeting.date)} · {formatDuration(meeting.duration_seconds)}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Delete
          </button>
        </div>
      </header>

      {/* Body fills the rest of the viewport; inner panels scroll on their own. */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <MediaPlayer
          audioRef={audioRef}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onSeek={seekTo}
        />

        {/* 60/40 split via a 5-col grid (3 + 2). */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="min-h-0 lg:col-span-3">
            <TranscriptPanel
              segments={meeting.transcript_segments}
              activeSegmentId={activeSegmentId}
              onSeekToSegment={seekTo}
              jumpToSegmentId={jumpSegmentId}
            />
          </div>
          <div className="min-h-0 lg:col-span-2">
            <MeetingTabs
              summary={meeting.summary}
              actionItems={actionItems}
              onToggleActionItem={handleToggleActionItem}
              onAddActionItem={handleAddActionItem}
              onDeleteActionItem={handleDeleteActionItem}
            />
          </div>
        </div>
      </div>

      {isEditOpen && (
        <EditMeetingModal
          meeting={meeting}
          onClose={() => setIsEditOpen(false)}
          onUpdated={handleMeetingUpdated}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Delete meeting"
        message={`Are you sure you want to delete "${meeting.title}"? This also removes its transcript, summary, and action items. This can't be undone.`}
        confirmLabel="Delete"
        isDangerous
        isSubmitting={isDeleting}
        onConfirm={handleDeleteMeeting}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
