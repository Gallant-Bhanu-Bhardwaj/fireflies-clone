import { useEffect, useMemo, useRef, useState } from "react";

import type { TranscriptSegment } from "../types";

/**
 * Keeps a media player and a transcript in sync.
 *
 * IMPORTANT — the audio is mocked. There is no real recording in this demo, so
 * the `<audio>` element's `duration`/`currentTime` are never populated. To keep
 * the seek bar, play/pause, click-to-seek, and auto-highlight features fully
 * demonstrable, this hook drives a *simulated* playback clock while "playing",
 * using the meeting's known length as the total duration. If a real media file
 * were wired to the <audio> element, we'd swap the interval for a `timeupdate`
 * listener reading `audio.currentTime` — the rest of the API stays the same.
 */
export function useTranscriptSync(
  segments: TranscriptSegment[],
  fallbackDuration: number
) {
  // Rendered into the real <audio> element so the markup is authentic and a
  // real src could be dropped in later without touching this hook's consumers.
  const audioRef = useRef<HTMLAudioElement>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // No real media file => no real audio.duration, so use the meeting length.
  const duration = fallbackDuration;

  // Advance the simulated clock ~4x/second while playing. Stop at the end.
  useEffect(() => {
    if (!isPlaying) return;

    const TICK_MS = 250;
    const id = setInterval(() => {
      setCurrentTime((t) => {
        const next = t + TICK_MS / 1000;
        if (next >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [isPlaying, duration]);

  // The segment currently "playing" — the one whose [start, end) window
  // contains currentTime. Drives the highlighted line in the transcript.
  const activeSegmentId = useMemo(() => {
    const active = segments.find(
      (s) => currentTime >= s.start_time && currentTime < s.end_time
    );
    return active?.id ?? null;
  }, [segments, currentTime]);

  // Jump playback to a specific time (used when a transcript line is clicked).
  function seekTo(time: number) {
    const clamped = Math.min(Math.max(0, time), duration);
    setCurrentTime(clamped);
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  }

  function togglePlay() {
    setIsPlaying((playing) => !playing);
  }

  return {
    audioRef,
    currentTime,
    duration,
    isPlaying,
    activeSegmentId,
    seekTo,
    togglePlay,
    // Exposed (in addition to seekTo) for callers that need to set the
    // initial position directly inside an effect — e.g. jumping to a
    // segment from a search result. Calling the raw setState setter
    // directly in an effect body is the React-sanctioned pattern; routing
    // it through seekTo (an indirect function reference) instead trips the
    // stricter React 19.2 `set-state-in-effect` lint rule.
    setCurrentTime,
  };
}
