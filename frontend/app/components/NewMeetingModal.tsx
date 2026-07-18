"use client";

import { useState } from "react";

import { API_BASE_URL, resolveParticipantIds } from "../lib/api";
import { parsePastedTranscript } from "../lib/transcript";
import Modal from "./Modal";
import TagInput from "./TagInput";
import { useToast } from "./ToastProvider";

type Tab = "paste" | "manual";

interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful create so the dashboard can refetch its list. */
  onCreated: () => void | Promise<void>;
}

const emptyManualForm = { title: "", date: "", participants: [] as string[] };

export default function NewMeetingModal({ isOpen, onClose, onCreated }: NewMeetingModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("paste");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");

  const [manualForm, setManualForm] = useState(emptyManualForm);

  // Shared across both tabs — tags describe the meeting regardless of how
  // it was created, so switching tabs shouldn't lose what's been typed.
  const [tags, setTags] = useState<string[]>([]);

  function resetAndClose() {
    setPasteTitle("");
    setPasteText("");
    setManualForm(emptyManualForm);
    setTags([]);
    setActiveTab("paste");
    onClose();
  }

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteTitle.trim()) {
      showToast("Title is required", "error");
      return;
    }

    const segments = parsePastedTranscript(pasteText);
    if (segments.length === 0) {
      showToast('No lines matched the "Speaker: text" format', "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const meetingRes = await fetch(`${API_BASE_URL}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pasteTitle.trim(),
          date: new Date().toISOString(),
          duration_seconds: segments[segments.length - 1].end_time,
          owner_id: 1,
          participant_ids: [],
          tags,
        }),
      });
      if (!meetingRes.ok) throw new Error("Failed to create meeting");
      const meeting: { id: number } = await meetingRes.json();

      const transcriptRes = await fetch(
        `${API_BASE_URL}/meetings/${meeting.id}/transcript`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(segments),
        }
      );
      if (!transcriptRes.ok) throw new Error("Failed to save transcript");

      showToast("Meeting created from transcript");
      await onCreated();
      resetAndClose();
    } catch {
      showToast("Couldn't create the meeting. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualForm.title.trim()) {
      showToast("Title is required", "error");
      return;
    }
    if (!manualForm.date) {
      showToast("Date is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const participantIds = await resolveParticipantIds(manualForm.participants);

      const res = await fetch(`${API_BASE_URL}/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualForm.title.trim(),
          date: new Date(manualForm.date).toISOString(),
          duration_seconds: 0,
          owner_id: 1,
          participant_ids: participantIds,
          tags,
        }),
      });
      if (!res.ok) throw new Error("Failed to create meeting");

      showToast("Meeting created");
      await onCreated();
      resetAndClose();
    } catch {
      showToast("Couldn't create the meeting. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="New Meeting">
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("paste")}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
            activeTab === "paste"
              ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Paste Transcript
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
            activeTab === "manual"
              ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Manual Form
        </button>
      </div>

      {activeTab === "paste" && (
        <form onSubmit={handlePasteSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
            <input
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Weekly sync"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Transcript
            </label>
            <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">
              One line per utterance, formatted as{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">Speaker: text</code>
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={8}
              placeholder={"Priya: Let's get started.\nMarcus: Sounds good."}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
            <TagInput tags={tags} onChange={setTags} placeholder="Type a tag, press Enter" />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Meeting"}
          </button>
        </form>
      )}

      {activeTab === "manual" && (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
            <input
              type="text"
              value={manualForm.title}
              onChange={(e) => setManualForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Weekly sync"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
            <input
              type="datetime-local"
              value={manualForm.date}
              onChange={(e) => setManualForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Participants
            </label>
            <TagInput
              tags={manualForm.participants}
              onChange={(participants) => setManualForm((f) => ({ ...f, participants }))}
              placeholder="Type a name, press Enter"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
            <TagInput tags={tags} onChange={setTags} placeholder="Type a tag, press Enter" />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Meeting"}
          </button>
        </form>
      )}
    </Modal>
  );
}
