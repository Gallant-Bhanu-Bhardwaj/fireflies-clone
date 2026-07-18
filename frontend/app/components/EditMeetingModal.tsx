"use client";

import { useState } from "react";

import { API_BASE_URL, resolveParticipantIds } from "../lib/api";
import type { MeetingDetail } from "../types";
import Modal from "./Modal";
import TagInput from "./TagInput";
import { useToast } from "./ToastProvider";

interface EditMeetingModalProps {
  meeting: MeetingDetail;
  onClose: () => void;
  onUpdated: (updated: MeetingDetail) => void;
}

/**
 * Edits title + participants only; date/duration are preserved as-is in the PUT.
 *
 * The parent only mounts this component while the modal is open (see
 * meetings/[id]/page.tsx), so the state below is always initialized fresh
 * from the current meeting — no effect needed to "reset" it on open.
 */
export default function EditMeetingModal({ meeting, onClose, onUpdated }: EditMeetingModalProps) {
  const { showToast } = useToast();
  const [title, setTitle] = useState(meeting.title);
  const [participants, setParticipants] = useState<string[]>(
    meeting.participants.map((p) => p.name)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const participantIds = await resolveParticipantIds(participants);

      const res = await fetch(`${API_BASE_URL}/meetings/${meeting.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          date: meeting.date,
          duration_seconds: meeting.duration_seconds,
          owner_id: meeting.owner.id,
          participant_ids: participantIds,
          // Not edited by this modal — pass through unchanged so the PUT
          // (a full replace) doesn't wipe the meeting's existing tags.
          tags: meeting.tags,
        }),
      });
      if (!res.ok) throw new Error("Failed to update meeting");
      const updated: MeetingDetail = await res.json();

      showToast("Meeting updated");
      onUpdated(updated);
      onClose();
    } catch {
      showToast("Couldn't update the meeting. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Edit Meeting">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Participants
          </label>
          <TagInput
            tags={participants}
            onChange={setParticipants}
            placeholder="Type a name, press Enter"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </Modal>
  );
}
