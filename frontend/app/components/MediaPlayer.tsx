"use client";

import type { RefObject } from "react";

import { formatTimestamp } from "../lib/format";
import { useTheme } from "./ThemeProvider";

interface MediaPlayerProps {
  audioRef: RefObject<HTMLAudioElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
}

/**
 * Custom audio player UI: play/pause + a seek bar showing current/total time.
 * The underlying <audio> element is mocked (no real recording) — see
 * useTranscriptSync for how playback is simulated.
 */
export default function MediaPlayer({
  audioRef,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
}: MediaPlayerProps) {
  const { theme } = useTheme();
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  // Inline style (needed for the dynamic gradient) can't use Tailwind's
  // `dark:` variant, so the track color is picked here instead.
  const trackColor = theme === "dark" ? "#334155" : "#e2e8f0";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Mocked source: there is no real media file in this demo. The element
          is kept so a real recording could be dropped in later. */}
      <audio ref={audioRef} />

      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700"
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
            <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
          </svg>
        )}
      </button>

      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
        {formatTimestamp(currentTime)}
      </span>

      {/* Range input styled as a thin seek bar; the filled portion uses a
          gradient background driven by the current progress percentage. */}
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Seek"
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-indigo-600"
        style={{
          background: `linear-gradient(to right, #4f46e5 ${progress}%, ${trackColor} ${progress}%)`,
        }}
      />

      <span className="w-12 shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
        {formatTimestamp(duration)}
      </span>
    </div>
  );
}
