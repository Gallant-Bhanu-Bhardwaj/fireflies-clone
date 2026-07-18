// Shape expected by POST /meetings/{id}/transcript (schemas.TranscriptSegmentBase).
export interface ParsedSegment {
  speaker_name: string;
  start_time: number;
  end_time: number;
  text: string;
  order_index: number;
}

// Pasted text has no real timing info, so each line is given a fixed-width
// mock window. Good enough to demo the seek/highlight features; a real
// import would carry actual start/end times per line instead.
const MOCK_SECONDS_PER_LINE = 5;

/**
 * Parse raw pasted text into transcript segments. Expects one utterance per
 * line in "Speaker: text" form; lines that don't match that shape are
 * skipped rather than guessed at.
 */
export function parsePastedTranscript(raw: string): ParsedSegment[] {
  const lines = raw.split("\n").map((line) => line.trim());

  const segments: ParsedSegment[] = [];
  for (const line of lines) {
    if (!line) continue;

    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) continue;

    const [, speaker, text] = match;
    const orderIndex = segments.length;
    segments.push({
      speaker_name: speaker.trim(),
      text: text.trim(),
      start_time: orderIndex * MOCK_SECONDS_PER_LINE,
      end_time: (orderIndex + 1) * MOCK_SECONDS_PER_LINE,
      order_index: orderIndex,
    });
  }

  return segments;
}
