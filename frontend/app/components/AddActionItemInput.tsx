"use client";

import { useState } from "react";

interface AddActionItemInputProps {
  onAdd: (text: string) => Promise<void> | void;
}

/** Inline "add a new action item" row — submits on Enter or button click. */
export default function AddActionItemInput({ onAdd }: AddActionItemInputProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAdd(trimmed);
      setText("");
    } catch {
      // Parent already surfaces a toast on failure; keep the draft so the user can retry.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-3 flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add an action item..."
        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      <button
        type="submit"
        disabled={isSubmitting || !text.trim()}
        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
