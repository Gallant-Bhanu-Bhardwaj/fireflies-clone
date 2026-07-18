import type { SearchResult } from "../types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Copy frontend/.env.local.example to " +
      "frontend/.env.local and set it to your backend's URL."
  );
}

export const API_BASE_URL = apiUrl;

/** Global search across meeting titles and transcript text. */
export async function searchMeetings(query: string): Promise<SearchResult[]> {
  const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

/**
 * Turn free-text participant names (from a tag input) into ids the backend
 * expects. Each name round-trips through get-or-create so a name typed
 * identically elsewhere resolves to the same participant row.
 */
export async function resolveParticipantIds(names: string[]): Promise<number[]> {
  return Promise.all(
    names.map(async (name) => {
      const res = await fetch(`${API_BASE_URL}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`Failed to resolve participant "${name}"`);
      const participant: { id: number } = await res.json();
      return participant.id;
    })
  );
}
