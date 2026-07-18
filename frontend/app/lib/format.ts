// Small formatting helpers shared by the meeting list UI.

/** "Jul 18, 2026 · 3:00 PM" */
export function formatMeetingDate(iso: string): string {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

/**
 * mm:ss for meetings under an hour, h:mm for anything longer — matches how
 * Fireflies displays call length in the meeting library.
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Clock-style timestamp for the player/transcript: mm:ss, or h:mm:ss past an
 * hour. Unlike formatDuration it always keeps seconds, which a seek bar needs.
 */
export function formatTimestamp(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** "Jane Doe" -> "JD", single names fall back to the first two letters */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Fixed palette (not random) so a given participant's avatar color stays
// stable across renders instead of shifting on every re-fetch.
const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-purple-500",
  "bg-fuchsia-500",
  "bg-violet-500",
  "bg-blue-500",
  "bg-pink-500",
];

export function getAvatarColor(seed: number): string {
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
}
